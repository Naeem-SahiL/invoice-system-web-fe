
export class StaticAppConfig {
  private static _config: any;

  static load(config: any) {
    StaticAppConfig._config = config;
  }

  static get(key: string): any {
    return StaticAppConfig._config?.[key];
  }

  static getAll(): any {
    return StaticAppConfig._config;
  }
}
