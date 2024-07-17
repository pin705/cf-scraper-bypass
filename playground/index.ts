import Scraper from "../src";

const scraper = new Scraper(false, false, "/usr/bin/chromium-browser", false);
runScraper()
function runScraper() {
  scraper.proxy("https://google.com", {
    query: { foo: "bar" },
    headers: { "User-Agent": "Mozilla/5.0" },
  }).then((res) => console.log(res));
}
