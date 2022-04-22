import { Argv, CommandModule, config } from "yargs";
import { getWorkspaceRoot, parseLockFile, queryLockFile } from "workspace-tools";
import { BundleInfo, BundlerInfoArgs } from "../types";
import fs from "fs";
import path from "path";
import { mdReporter } from "../reporters";

export const infoCommand: CommandModule<{}, BundlerInfoArgs> = {
  command: ["info", "$0"],

  describe: "gathers bundler information",

  builder(args: Argv) {
    return args
      .positional("packagePath", {
        describe: "The directory for a package to gather information from",
        type: "string",
      })
      .option("config", {
        describe: "The path to a bundler configuration file (defaults to the same as the directory with package.json)",
        type: "string",
        required: false,
      });
  },

  /**
   * Handler for the info command module
   *
   * TODO: currently tied to webpack, but should be able to support other bundlers
   * TODO: currently tied to yarn, but should be able to support other package managers
   *
   * @param args
   */
  async handler(args) {
    const root = getWorkspaceRoot(args._.join(" ") ?? process.cwd());
    const packagePath = args._.join(" ") ?? root;

    if (!root) {
      throw new Error("Could not find a lockfile in the given path");
    }

    const lockInfo = await parseLockFile(root);
    const webpackVersions = new Set<string>();

    Object.entries(lockInfo.object)
      .filter(([nameVersion, _info]) => {
        return nameVersion.startsWith("webpack@");
      })
      .forEach(([_nameVersion, info]) => {
        webpackVersions.add(info.version);
      });

    // TODO: handle TS configs
    const configPath = findFirst(args.config, path.join(packagePath, "webpack.config.js"));
    let webpackConfigs = [];

    if (configPath) {
      /** simulate the root for webpack */
      const cwd = process.cwd();
      process.chdir(path.dirname(configPath));

      webpackConfigs = processWebpackConfig(require(configPath));

      /** restore the cwd after processingWebpackConfig */
      process.chdir(cwd);
    }

    const info: BundleInfo = {
      webpackVersions: [...webpackVersions],
      webpackConfigs,
      numConfigs: webpackConfigs.length,
      plugins: webpackConfigs.flatMap((config) => config.plugins),
      loaders: getLoaders(webpackConfigs),
      entries: webpackConfigs.flatMap((config) => config.entry),
    };

    mdReporter(info);
  },
};

function getLoaders(webpackConfigs: any) {
  const loaders = new Set();
  webpackConfigs.forEach((config) => {
    config.module?.rules.forEach((rule) => {
      if (rule.use) {
        if (Array.isArray(rule.use)) {
          rule.use.forEach((loader) => {
            if (typeof loader === "string") {
              loaders.add(loader);
            } else if (typeof loader === "object") {
              loaders.add(loader.loader);
            }
          });
        } else if (typeof rule.use === "string") {
          loaders.add(rule.use);
        } else if (typeof rule.use === "object") {
          loaders.add(rule.use.loader);
        }
      }
    });
  });

  return [...loaders];
}

/**
 * TODO: support env args
 * @param config
 */
function processWebpackConfig(config: Object | Object[] | Function) {
  if (Array.isArray(config)) {
    return config.map(processWebpackConfig).flat();
  } else if (typeof config === "function") {
    return processWebpackConfig(config());
  } else if (typeof config === "object") {
    return [config];
  }
}

function findFirst(...files: (string | undefined)[]) {
  for (const file of files) {
    if (file && fs.existsSync(file)) {
      return file;
    }
  }
}
