import { API, Options, type ScraperOptions } from "./scraper";

export default class Scraper {
  private options: Options = {
    headless: false,
    skip_chromium_download: false,
    chromium_path: "/usr/bin/chromium-browser",
    wait_for_network_idle: false,
    PUP_TIMEOUT: 16_000,
  }

  client: API;

  constructor(options: Options) {
    this.options = { ...this.options, ...options }; // Merge default and passed options
    this.client = new API(this.options);
  }

  async proxy(url: string, options: ScraperOptions): Promise<string | undefined> {
    const seriURL = `${url}?${serialize(options.query as Record<string, string | number | boolean>)}`;
    try {
      const response = await this.client.request(seriURL, {
        headers: options.headers as Record<string, string>,
      });
      return response.content;
    } finally {
      await this.client.close();
    }
  }
}

function serialize(obj?: Record<string, string | number | boolean>): string {
  return obj
    ? Object.entries(obj)
        .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
        .join("&")
    : "";
}
