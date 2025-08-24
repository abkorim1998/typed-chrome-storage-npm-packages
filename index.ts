export class ChromeStorage<T extends Record<string, any>> {
    readonly defaultSettings: T;

    constructor(params: { defaultSettings: T }) {
        this.defaultSettings = params.defaultSettings;
    }

    /**
     * Main entry point for getting settings and watching changes
     */
    getSettings<K extends keyof T>(keys: K[]): StorageOperation<T, K> {
        const promise = new Promise<Pick<T, K>>((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }

                const settings = {} as Pick<T, K>;
                for (const key of keys) {
                    settings[key] = result[key as string] ?? this.defaultSettings[key];
                }
                resolve(settings);
            });
        });

        return new StorageOperation(this, keys, promise);
    }

    /**
     * Standalone watch method with manual cleanup
     */
    watchSettings<K extends keyof T>(
        keys: K[],
        callback: (settings: Pick<T, K>) => void
    ): () => void {
        const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
            if (keys.some(key => key in changes)) {
                this.getSettings(keys).then(callback);
            }
        };

        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }

    async setSettings(settings: Partial<T>): Promise<void> {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(settings, () => {
                chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
            });
        });
    }
}

class StorageOperation<T extends Record<string, any>, K extends keyof T> {
    private listeners: Array<() => void> = [];

    constructor(
        private readonly storage: ChromeStorage<T>,
        private readonly keys: K[],
        private readonly promise: Promise<Pick<T, K>>
    ) {}

    /**
     * Watch for changes with automatic initial callback
     */
    watch(callback: (settings: Pick<T, K>) => void): this {
        // Initial callback
        this.promise.then(callback);

        // Watch for future changes
        const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
            if (this.keys.some(key => key in changes)) {
                this.storage.getSettings(this.keys).then(callback);
            }
        };

        chrome.storage.onChanged.addListener(listener);
        this.listeners.push(() => chrome.storage.onChanged.removeListener(listener));

        return this;
    }

    /**
     * Clean up all watchers
     */
    unwatch(): this {
        this.listeners.forEach(remove => remove());
        this.listeners = [];
        return this;
    }

    /**
     * Promise chain methods
     */
    then<TResult1 = Pick<T, K>, TResult2 = never>(
        onfulfilled?: (value: Pick<T, K>) => TResult1 | PromiseLike<TResult1>,
        onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }

    catch<TResult = never>(
        onrejected?: (reason: any) => TResult | PromiseLike<TResult>
    ): Promise<Pick<T, K> | TResult> {
        return this.promise.catch(onrejected);
    }

    finally(onfinally?: () => void): Promise<Pick<T, K>> {
        return this.promise.finally(onfinally);
    }
}