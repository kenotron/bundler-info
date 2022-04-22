import { BundleInfo } from "./types";

export function jsonReporter(bundleInfo: BundleInfo) {}

export function mdReporter(bundleInfo: BundleInfo) {
  console.log(`
# Webpack Bundler Info

Versions present in repo: ${bundleInfo.webpackVersions.join(", ")}

## Webpack Configs

Number of configs: ${bundleInfo.numConfigs}

## Plugins

${bundleInfo.plugins.map((plugin) => `- ${plugin.constructor.name}`).join("\n")}

## Loaders

${bundleInfo.loaders.map((loader) => `- ${loader}`).join("\n")}

## Entry Points

${Object.entries(bundleInfo.entries)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n")}
`);
}
