# typed-chrome-storage-npm-packages

This package is a fork of [typed-chrome-storage](https://github.com/abkorim1998/typed-chrome-storage).

```
import { ChromeStorage } from "@oryno/typed-chrome-storage"

export const storage = new ChromeStorage<TSettings>({
    defaultSettings: {
        isScrapeByKeyword: true,
        currentPlaceName: '',
        status: false,
        keyWordList: [],
        currentKeyWordPosition: 0,
        loaderCounter: 0,
        statusMessage: "Welcome! Please enter your keywords and click 'Start' to begin.",
        isWebsiteExtractedEnabled: true,
        fileName: 'leads',

        speed: 300,

        totalLeadsCount: 0,
        trial: false,
        activated: false,
        licenseKey: '',
        
        towCapchaKey: null,
        ActivationData: null,

        tabId: null,
    }
});


// use anywhere in you chrome extension like this.
const { status, keyWordList, currentKeyWordPosition } = await storage.getSettings(['status', 'keyWordList', 'currentKeyWordPosition']);

// watch changes
storage.watchSettings(['status', 'keyWordList', 'currentKeyWordPosition'], (changes) => {
    console.log('Settings changed:', changes);
});
