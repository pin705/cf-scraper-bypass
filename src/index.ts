import { API, type ScraperOptions } from "./scraper";

export default class Scraper {
  public headless = false;
  public skip_chromium_download = false;
  public chromium_path = "/usr/bin/chromium-browser";
  public wait_for_network_idle = false;

  constructor(
    headless: boolean,
    skip_chromium_download: boolean,
    chromium_path: string,
    wait_for_network_idle: boolean,
  ) {
    this.headless = headless;
    this.skip_chromium_download = skip_chromium_download;
    this.chromium_path = chromium_path;
    this.wait_for_network_idle = wait_for_network_idle;
  }

  async proxy(url: string, options: ScraperOptions) {
    // Initialize the API instance
    const Api = new API({
      headless: this.headless,
      skip_chromium_download: this.skip_chromium_download,
      chromium_path: this.chromium_path,
      wait_for_network_idle: this.wait_for_network_idle,
    });
    const seriURL = `${url}?${serialize(options.query as Record<string, string | number | boolean>)}`;
    try {
      const response = await Api.request(seriURL, {
        headers: options.headers as Record<string, string>,
      });
      return response.content;
    } finally {
      // Make sure to close the API instance even if an error occurs
      await Api.close();
    }
  }
}

function serialize(obj?: Record<string, string | number | boolean>) {
  const str = [];
  for (const p in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, p))
      str.push(`${encodeURIComponent(p)}=${encodeURIComponent(obj[p])}`);
  }
  return str.join("&");
}
