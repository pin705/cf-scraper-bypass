# @pinjs/cf-scraper-bypass

<!-- automd:badges color=yellow -->

[![npm version](https://img.shields.io/npm/v/@pinjs/cf-scraper-bypass?color=yellow)](https://npmjs.com/package/@pinjs/cf-scraper-bypass)
[![npm downloads](https://img.shields.io/npm/dm/@pinjs/cf-scraper-bypass?color=yellow)](https://npmjs.com/package/@pinjs/cf-scraper-bypass)

<!-- /automd -->

A simple tool to scrape Cloudflare clearance cookies (cf_clearance) from websites with Cloudflare challenges.

## Usage

Install package:

<!-- automd:pm-install -->

```sh
# ✨ Auto-detect
npx nypm install @pinjs/cf-scraper-bypass

# npm
npm install @pinjs/cf-scraper-bypass

# yarn
yarn add @pinjs/cf-scraper-bypass

# pnpm
pnpm install @pinjs/cf-scraper-bypass

# bun
bun install @pinjs/cf-scraper-bypass
```

```js
import Scraper from "@pinjs/cf-scraper-bypass";

const scraper = new Scraper({
  headless: false,
  skip_chromium_download: false,
  chromium_path: "/usr/bin/chromium-browser",
  wait_for_network_idle: false,
  PUP_TIMEOUT: 16_000,
});

scraper
    .proxy("https://nopecha.com/demo/cloudflare")
    .then((res) => console.log(res));
```

<!-- /automd -->

Import:

<!-- automd:jsimport cjs cdn name="@pinjs/cf-scraper-bypass" -->

**ESM** (Node.js, Bun)

```js
import Scraper from "@pinjs/cf-scraper-bypass";
```

**CommonJS** (Legacy Node.js)

```js
const Scraper = require("@pinjs/cf-scraper-bypass");
```

**CDN** (Deno, Bun and Browsers)

```js
import Scraper from "https://esm.sh/@pinjs/cf-scraper-bypass";
```

<!-- /automd -->

## Development

<details>

<summary>local development</summary>

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run interactive tests using `pnpm dev`

</details>

## License

<!-- automd:contributors license=MIT -->

Published under the [MIT](https://github.com/pin705/cf-scraper-bypass/blob/main/LICENSE) license.
Made by [community](https://github.com/pin705/cf-scraper-bypass/graphs/contributors) 💛
<br><br>
<a href="https://github.com/pin705/cf-scraper-bypass/graphs/contributors">
<img src="https://contrib.rocks/image?repo=pin705/cf-scraper-bypass" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
