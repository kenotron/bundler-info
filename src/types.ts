export interface BundlerInfoArgs {
  _?: string;
  config?: string;
}

export interface BundleInfo {
  webpackVersions: string[];
  webpackConfigs: any[];
  numConfigs: number;
  plugins: any[];
  loaders: any[];
  entries: string | string[] | { [key: string]: string | string[] };
}
