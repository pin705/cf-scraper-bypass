import Scraper from "../src";

const scraper = new Scraper({
  headless: false,
  skip_chromium_download: false,
  chromium_path: "/usr/bin/chromium-browser",
  wait_for_network_idle: false,
  PUP_TIMEOUT: 16_000,
});

runScraper();
function runScraper() {
  scraper.proxy("https://google.com", {})
    .then((res) => console.log(res));
}
