// The standard, checked in a real browser — the part no unit test can see.
//
//   pnpm run demo && node test/browser.mjs
//
//  - every chip and day is at least 44px (a thumb has to land on it)
//  - the date field's real input is 16px (below it iOS zooms on focus)
//  - no horizontal page scroll at 390px — the day strip scrolls inside itself
//  - a booking can be made in taps alone, and resolves to real instants
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!path.startsWith(root)) return res.writeHead(403).end();
  try {
    const body = await readFile(path);
    res
      .writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" })
      .end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://localhost:${server.address().port}/demo/index.html`;

let failures = 0;
const check = (ok, what) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${what}`);
  if (!ok) failures++;
};

const browser = await chromium.launch();
try {
  for (const [name, width, height, dark] of [
    ["desktop light", 1280, 800, false],
    ["phone light", 390, 844, false],
    ["phone dark", 390, 844, true],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    if (dark) await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForSelector(".wk-day");

    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${name}: no horizontal page scroll`,
    );

    // Tap through an hourly booking: tomorrow, first start time, 2 hours.
    const hourly = page.locator("#hourly");
    await hourly.locator(".wk-day").nth(1).click();
    await hourly.getByRole("radiogroup", { name: "Start" }).getByRole("radio").first().click();
    await hourly
      .getByRole("radiogroup", { name: "For how long" })
      .getByRole("radio")
      .nth(1)
      .click();
    const summary = (await hourly.locator(".wk-summary").innerText()).trim();
    check(
      /Tomorrow|\d/.test(summary) && /–/.test(summary),
      `${name}: hourly summary reads "${summary}"`,
    );
    const resolved = JSON.parse((await page.locator("#hourly-resolved").innerText()) || "null");
    check(
      resolved && new Date(resolved.endsAt) - new Date(resolved.startsAt) === 2 * 3600_000,
      `${name}: hourly resolves to a 2-hour window`,
    );

    await page.waitForTimeout(300);
    await hourly.screenshot({
      path: join(root, "demo", "dist", `${name.replace(/ /g, "-")}-hourly.png`),
    });

    // Tap a range on the daily picker.
    const daily = page.locator("#daily");
    await daily.locator(".wk-day").nth(2).click();
    await daily.locator(".wk-day").nth(4).click();
    const dailySummary = (await daily.locator(".wk-summary").innerText()).trim();
    check(/3 days/.test(dailySummary), `${name}: daily range reads "${dailySummary}"`);

    // Flexible needs no day at all.
    await hourly.getByRole("radio", { name: "I'm flexible" }).click();
    check(
      /Flexible/.test(await hourly.locator(".wk-summary").innerText()),
      `${name}: flexible request without a day`,
    );

    // The app's own classes win over whenkit's defaults — plain CSS and a
    // layered (Tailwind-style) utility alike. Without @layer base for the
    // defaults, whenkit's unlayered rules would beat the layered utility.
    const own = await page.evaluate(() => {
      const css = (sel) => getComputedStyle(document.querySelector(sel));
      return {
        plainBorder: css("#own-class .wk-input").borderTopColor,
        plainWidth: css("#own-class .wk-input").borderTopWidth,
        utilWidth: css("#util-class .wk-input").borderTopWidth,
        utilStyle: css("#util-class .wk-input").borderTopStyle,
      };
    });
    check(
      own.plainBorder === "rgb(255, 0, 0)" && own.plainWidth === "3px",
      `${name}: an app class beats whenkit's input look (${own.plainBorder} ${own.plainWidth})`,
    );
    check(
      own.utilWidth === "5px" && own.utilStyle === "dashed",
      `${name}: a layered utility beats it too (${own.utilWidth} ${own.utilStyle})`,
    );

    // A dense app input stays dense: the icon scales with the text instead of
    // forcing a 20px line into a 12px field.
    const compactHeight = await page.evaluate(
      () => document.querySelector("#compact-class .wk-input").getBoundingClientRect().height,
    );
    check(
      compactHeight <= 32,
      `${name}: a 12px compact date input stays compact (${Math.round(compactHeight)}px)`,
    );

    const small = await page.evaluate(
      () =>
        [
          ...document.querySelectorAll(
            ".wk-chip, .wk-day, .wk-field .wk-input, .wk-other .wk-input",
          ),
        ]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.height < 43.5 || r.width < 43.5).length,
    );
    check(small === 0, `${name}: every chip, day and field is at least 44px (${small} too small)`);

    const inputSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector(".wk-input-native")).fontSize),
    );
    check(inputSize >= 16, `${name}: date input is ${inputSize}px (iOS zooms below 16)`);

    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `${name}: still no horizontal scroll after picking`,
    );
    // Nothing may be wider than its column: a grid cell (like a dialog's) must
    // not be propped open by the day strip.
    const wider = await page.evaluate(
      () =>
        [...document.querySelectorAll(".grid > section, #dialog")].filter(
          (s) =>
            s.scrollWidth > s.clientWidth + 1 ||
            s.getBoundingClientRect().right > window.innerWidth + 1,
        ).length,
    );
    check(wider === 0, `${name}: no column or dialog propped open by the picker (${wider})`);
    const sendVisible = await page.evaluate(() => {
      const r = document.getElementById("dialog-send").getBoundingClientRect();
      return r.right <= window.innerWidth + 1;
    });
    check(sendVisible, `${name}: the dialog's button stays on screen`);

    check(errors.length === 0, `${name}: no page errors ${errors.join(" | ")}`);
    // Let chip colour transitions finish so the screenshot shows real states.
    await page.waitForTimeout(300);
    await page.screenshot({
      path: join(root, "demo", "dist", `${name.replace(/ /g, "-")}.png`),
      fullPage: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failures ? 1 : 0);
