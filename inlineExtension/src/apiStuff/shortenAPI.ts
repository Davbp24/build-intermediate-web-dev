
// Define types for the Shortener API parameters
export type SummaryType = "key-points" | "tldr" | "teaser" | "headline";
export type SummaryFormat = "markdown" | "plain-text";
export type SummaryLength = "short";

// Define types for the Shortener API configuration
export interface ShortenAPI {
    sharedContext?: string;
    type?: SummaryType;
    format?: SummaryFormat;
    length?: SummaryLength;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
}

interface ShortenerRuntime {
    shorten(text: string, options?: { context?: string }): Promise<string>;
}

interface ShortenerCreateOptions extends ShortenAPI {
    monitor?: (m: {
        addEventListener: (
            event: string,
            listener: (e: { loaded: number }) => void,
        ) => void;
    }) => void;
}

declare const Shortener: {
    availability(): Promise<string>;
    create(options?: ShortenerCreateOptions): Promise<ShortenerRuntime>;
};

// ChromeShortener class to interact with the Shortener API
export class ChromeShortener {
    private shortener: ShortenerRuntime | null = null;
    private config: ShortenAPI;
    
    constructor(config: ShortenAPI = {}) {
        this.config = config;
    }

    static async isSupported(): Promise<boolean> {
        return "Shortener" in globalThis &&
         (await Shortener.availability()) !== "unavailable";
      }

    shorten(text: string, context?: string): Promise<string> {
    if (!this.shortener) {
        throw new Error("Shortener not initialized. Call init() after user activation.");
    }

    return this.shortener.shorten(text, { context });
    }

    async init(): Promise<void> {
        const availability = await Shortener.availability();
        if (availability === "unavailable") {
            throw new Error("Shortener API unavailable on this device.");
        }
        if (!navigator.userActivation.isActive) {
            throw new Error("User activation required before initializing Shortener.");
        }
        this.shortener = await Shortener.create({...this.config,monitor(m: { addEventListener: (event: string, listener: (e: { loaded: number }) => void) => void; }) {
            m.addEventListener("downloadprogress", (e: { loaded: number }) => {
                console.log(`Model download: ${(e.loaded * 100).toFixed(1)}%`);
            });
        }});
    }
}