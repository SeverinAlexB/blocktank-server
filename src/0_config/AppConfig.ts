import { IConfig } from './IConfig'
import { defaultConfig } from './defaultConfig';

export class AppConfig {
    private static _config: IConfig;
    static get(): IConfig {
        if (!this._config) {
            this._config = this.read()
        }
        return this._config
    }
    private static read(path: string = 'config.js'): IConfig {
        const cwd = process.cwd()
        const parsed = require( cwd + '/' + path)
        return Object.assign({}, defaultConfig, parsed)
    }
}