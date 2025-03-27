import { EventEmitter } from 'events';
import { getEnvVar } from './env-manager';

interface GlobalOptions {
    skipEvents: boolean;
    skipVersionCheck: boolean;
    baseRpcUrl?: string;
    backendUrl?: string;
    debug?: boolean;
}

class GlobalOptionsManager extends EventEmitter {
    private static instance: GlobalOptionsManager;
    private options: GlobalOptions = {
        skipEvents: false,
        skipVersionCheck: false,
    };

    private constructor() {
        super();
        this.options.debug = getEnvVar('ANYFLOW_DEBUG') === 'true';
    }

    public static getInstance(): GlobalOptionsManager {
        if (!GlobalOptionsManager.instance) {
            GlobalOptionsManager.instance = new GlobalOptionsManager();
        }
        return GlobalOptionsManager.instance;
    }

    public setOptions(options: Partial<GlobalOptions>): void {
        this.options = {
            ...this.options,
            ...options,
        };
        this.emit('optionsChanged', this.options);
    }

    public getOptions(): GlobalOptions {
        return { ...this.options };
    }

    public getOption<K extends keyof GlobalOptions>(key: K): GlobalOptions[K] {
        return this.options[key];
    }

    public reset(): void {
        this.options = {
            skipEvents: false,
            skipVersionCheck: false,
        };
        this.emit('optionsChanged', this.options);
    }
}

export const globalOptions = GlobalOptionsManager.getInstance();
