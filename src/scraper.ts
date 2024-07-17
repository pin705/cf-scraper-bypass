import type { Browser, Page } from "puppeteer";
import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Cookie, CookieJar } from "tough-cookie";

export type ScraperOptions<TQuery = unknown, THeaders = unknown> = {
  query?: Record<string, TQuery>;
  headers?: Record<string, THeaders>;
};

export interface Options {
  headless?: boolean;
  skip_chromium_download?: boolean;
  chromium_path?: string;
  wait_for_network_idle?: boolean;
  PUP_TIMEOUT?: number;
}

interface RequestMeta {
  url: string;
  options: RequestInit;
  cookies: string;
  userAgent: string;
}

interface CookieMeta {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export class API {
  private requests: RequestMeta[] = [];
  private cookies: CookieJar = new CookieJar();
  private options: Options;
  private browser?: Browser = undefined;

  /**
   * @constructor
   * @description You will NEED to use non-headless mode. It doesn't work otherwise.
   * @param headless Whether to use healdess mode or not. This is required to be false, but for testing you can set it to true.
   * @param skip_chromium_download Whether to skip downloading Chromium. If you're using a VPS, you can set this to true and set the path to the Chromium binary.
   * @param chromium_path Path to the Chromium binary. Only used if skip_chromium_download is true.
   * @param wait_for_network_idle Whether to wait for the network to be idle before returning the response. This is useful for sites that use AJAX to load content.
   */
  constructor(options: {
    headless?: boolean;
    skip_chromium_download?: boolean;
    chromium_path?: string;
    wait_for_network_idle?: boolean;
    PUP_TIMEOUT?: number;
  }) {
    this.options = options;
  }

  /**
   * @description Initialize the browser
   */
  public async init() {
    puppeteer.use(StealthPlugin());

    // These can be optimized more. I just put them here for now.
    const options = {
      headless: this.options.headless,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      ignoreHTTPSErrors: true,
      defaultViewport: undefined,
      ignoreDefaultArgs: ["--disable-extensions"],
      executablePath: executablePath(),
      env: {
        DISPLAY: ":10.0",
      },
    };
    if (this.options.skip_chromium_download)
      options.executablePath = this.options.chromium_path || "";

    // Launches the browser
    this.browser = await puppeteer.launch(options);
  }

  /**
   * @description Safely closes the browser instance. Not necessary to call this function; just have it for good measure.
   */
  public async close() {
    if (!this.browser) return;

    await this.browser.close();
    // Resets the browser variable so that if the object is used again, the browser will be re-initialized
    this.browser = undefined;
  }

  /**
   * @description First checks if there are any valid cookies for the URL requested. If not, it will request the URL and get the cookies using Puppeteer. If there are valid cookies, it will use those cookies to make the request.
   * @param url Request URL
   * @param options RequestInit config. Be careful of of using a custom User-Agent/Cookie header, as it will be overwritten.
   * @returns Promise<{ content: string, statusCode: number; headers: Headers }>
   */
  public async request(
    url: string,
    options: { headers?: Record<string, string> },
  ): Promise<{ content: string; statusCode: number; headers: Headers }> {
    // First check if the request is stored in the object
    const possible = this.getRequest(url);

    if (!possible) {
      const response = await fetch(url, options);
      const content = await response.text();

      if (!this.isCloudflareJSChallenge(content)) {
        // No need to fetch headers, just return the response
        return {
          content,
          statusCode: response.status,
          headers: response.headers,
        };
      }

      // Fetch headers needed to bypass CloudFlare.
      const headers = await this.getHeaders(url);
      this.requests.push({
        url,
        options,
        cookies: headers.Cookie,
        userAgent: headers["User-Agent"],
      });

      if (!options.headers) {
        options.headers = {};
      }

      options.headers["User-Agent"] = headers["User-Agent"];
      options.headers.Cookie = headers.Cookie;

      // Send a request with the headers
      const responseWithHeaders = await fetch(url, options);

      return {
        content: await responseWithHeaders.text(),
        statusCode: responseWithHeaders.status,
        headers: responseWithHeaders.headers,
      };
    }

    // Set the headers/cookies to the stored request
    if (!options.headers) {
      options.headers = {};
    }

    options.headers["User-Agent"] = possible.userAgent;
    options.headers.Cookie = possible.cookies;
    // Try to send the request
    const response = await fetch(url, options);
    const content = await response.text();

    // Check if the error is due to a CloudFlare challenge
    if (this.isCloudflareJSChallenge(content)) {
      // If it is, remove the request (it's invalid)
      this.removeRequest(url);
      // Try to send the request again with new headers
      return this.request(url, options);
    }

    return {
      content,
      statusCode: response.status,
      headers: response.headers,
    };
  }

  /**
   * @description Checks if there is a request object for the URL
   * @param url URL to check for
   * @returns Requests object if found, otherwise undefined
   */
  private getRequest(url: string): RequestMeta | undefined {
    return this.requests.find((request) => request.url === url);
  }

  /**
   * @description Removes a request object from the requests array
   * @param url URL to remove from the requests array
   */
  private removeRequest(url: string) {
    const index = this.requests.findIndex((request) => request.url === url);

    if (index !== -1) this.requests.splice(index, 1);
  }

  /**
   * @description Checks if the request is a Cloudflare JS challenge
   * @param content HTML content
   * @returns Boolean
   */
  private isCloudflareJSChallenge(content: string): boolean {
    return content.includes("_cf_chl_opt");
  }

  /**
   * @description Gets the headers for the URL requested to bypass CloudFlare
   * @param url URL to fetch
   * @returns Promise<{ 'User-Agent': string, 'Cookie': string }>
   */
  private async getHeaders(
    url: string,
  ): Promise<{ "User-Agent": string; Cookie: string }> {
    // Check if the browser is open or not
    if (!this.browser) {
      // Launch the browser
      await this.init();
    }

    const page = await this.browser.newPage();
    await page.goto(url);

    // Basic timeout
    // There's an env variable for this if you want to change it
    const timeoutInMs = Number(this.options.PUP_TIMEOUT) || 16_000;

    // Update the HTML content until the CloudFlare challenge loads
    let count = 0;
    let content = "";
    while (true) {
      count += 1;

      if (count === 10)
        throw new Error(
          "Cloudflare challenge not resolved after multiple attempts",
        );

      // Wait for the page to load completely or for Cloudflare challenge to resolve
      await Promise.race([
        page.waitForNavigation({
          waitUntil: "networkidle2",
          timeout: timeoutInMs,
        }),
        page.waitForFunction(
          () => !document.body.innerHTML.includes("_cf_chl_opt"),
          { timeout: timeoutInMs },
        ),
      ]);

      content = await page.content();

      if (!this.isCloudflareJSChallenge(content)) break;
    }

    // Fetch the browser's cookies (contains cf_clearance and other important cookies to bypass CloudFlare)
    const cookies = await page.cookies();
    for (const cookie of cookies) {
      // Update the cookie jar
      const cookieMeta: CookieMeta = cookie as unknown as CookieMeta;
      this.cookies
        .setCookie(this.toToughCookie(cookieMeta), url.toString())
        .catch((error_: Error) => {
          console.error(error_);
        });
    }

    // You need to fetch the User-Agent since you can't bypass CloudFlare without a valid one
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const cookieList = await this.cookies.getCookies(url);

    // These are the headers required to bypass CloudFlare
    const headers = {
      "User-Agent": userAgent, // Browser User-Agent
      Cookie: cookieList
        .map((cookie: Cookie) => `${cookie.key}=${cookie.value}`)
        .join("; "), // Cookies as a string
    };

    // No need to use that page anymore.
    if (!page) await (page as Page).close();

    return headers;
  }

  /**
   * @description Converts a Puppeteer cookie to a tough-cookie cookie
   * @param cookie Cookie object
   * @returns Cookie
   */
  private toToughCookie(cookie: CookieMeta): Cookie {
    const { name, value, expires, domain, path } = cookie;
    const isExpiresValid = expires && typeof expires === "number";
    const expiresDate = isExpiresValid
      ? new Date(expires * 1000)
      : new Date(Date.now() + 9999 * 1000);
    return new Cookie({
      key: name,
      value,
      expires: expiresDate,
      domain: domain.startsWith(".") ? domain.slice(1) : domain,
      path,
    });
  }
}
