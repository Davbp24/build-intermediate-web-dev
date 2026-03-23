// Define types for the Summarizer API parameters
export type SummaryType = "key-points" | "tldr" | "teaser" | "headline";
export type SummaryFormat = "markdown" | "plain-text";
export type SummaryLength = "short" | "medium" | "long";

// Define types for the Summarizer API configuration
export interface SummarizerAPI {
    sharedContext?: string;
    type?: SummaryType;
    format?: SummaryFormat;
    length?: SummaryLength;
    expectedInputLanguages?: string[];
    expectedContextLanguages?: string[];
    outputLanguage?: string;
}

interface SummarizerRuntime {
  summarize(text: string, options?: { context?: string }): Promise<string>;
}

interface SummarizerCreateOptions extends SummarizerAPI {
  monitor?: (m: {
    addEventListener: (
      event: string,
      listener: (e: { loaded: number }) => void,
    ) => void;
  }) => void;
}

declare const Summarizer: {
  availability(): Promise<string>;
  create(options?: SummarizerCreateOptions): Promise<SummarizerRuntime>;
};

export class ChromeSummarizer {
  private summarizer: SummarizerRuntime | null = null;
  private config: SummarizerAPI;

  constructor(config: SummarizerAPI = {}) {
    this.config = config;
 }

    /** Check if the browser supports the Summarizer API */
    static async isSupported(): Promise<boolean> {
        return "Summarizer" in globalThis &&
         (await Summarizer.availability()) !== "unavailable";
      }

    summarize(text: string, context?: string): Promise<string> {
    if (!this.summarizer) {
        throw new Error("Summarizer not initialized. Call init() after user activation.");
    }
    return this.summarizer.summarize(text, { context });
  }


  /** Initialize and trigger model download (requires user activation) */
  async init(): Promise<void> {
    const availability = await Summarizer.availability();
    if (availability === "unavailable") {
        throw new Error("Summarizer API unavailable on this device.");
    }

    if (!navigator.userActivation.isActive) {
        throw new Error("User activation required before initializing Summarizer.");
    }

    this.summarizer = await Summarizer.create({...this.config,monitor(m: { addEventListener: (arg0: string, arg1: (e: { loaded: number; }) => void) => void; }) {
      m.addEventListener("downloadprogress", (e: { loaded: number; }) => {
        console.log(`Model download: ${(e.loaded * 100).toFixed(1)}%`);
      });
    }
  });
}
}
