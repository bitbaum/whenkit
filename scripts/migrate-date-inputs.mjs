#!/usr/bin/env node
// Replace `<input type="date">` / `<input type="datetime-local">` with whenkit's
// DateInput — a drop-in (same props, same onChange(event)), so only the TAG
// changes. Nothing else in the file is touched except one import line.
//
//   node scripts/migrate-date-inputs.mjs <dir> --import "@/components/ui/date-input" [--from input] [--write]
//
//   --import  module that exports DateInput (a one-line re-export per app that
//             also imports "@bitbaum/whenkit/styles.css" once)
//   --from    tag to replace: `input` (default) or a wrapper such as `Input`
//   --write   apply; without it, a dry run that only reports
//
// It is a tag scanner, not a regex over attributes: it walks the JSX opening
// tag honouring braces, strings and template literals, so `onChange={(e) => …}`
// and multi-line props cannot confuse it. Anything it will NOT convert safely
// is listed for a human: spread props (`{...register("x")}`) are kept (DateInput
// forwards them) but flagged, and a dynamic `type={…}` is flagged, never guessed.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith("--"));
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const write = args.includes("--write");
const from = opt("from", "input");
const importFrom = opt("import");
if (!root || !importFrom) {
  console.error(
    'usage: migrate-date-inputs.mjs <dir> --import "<module>" [--from input|Input] [--write]',
  );
  process.exit(2);
}

const SKIP =
  /(^|\/)(node_modules|\.next|\.claude|dist|build|coverage|__tests__|tests?|e2e|cypress|\.git)(\/|$)/;
const FILE = /\.(tsx|jsx)$/;
const TEST_FILE = /\.(test|spec|stories)\.(tsx|jsx)$/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (SKIP.test(relative(root, path))) continue;
    const st = statSync(path);
    if (st.isDirectory()) yield* walk(path);
    else if (FILE.test(name) && !TEST_FILE.test(name)) yield path;
  }
}

/** End index (exclusive) of the JSX opening tag starting at `start` (`<tag`), or -1. */
function tagEnd(src, start) {
  let depth = 0; // braces
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (depth === 0) {
      if (c === '"' || c === "'") {
        const close = src.indexOf(c, i + 1);
        if (close < 0) return -1;
        i = close + 1;
        continue;
      }
      if (c === "{") depth++;
      else if (c === ">") return i + 1;
    } else {
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === '"' || c === "'" || c === "`") {
        // string inside an expression
        let j = i + 1;
        while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return -1;
}

const TYPE_STATIC =
  /\btype=(?:"(date|datetime-local)"|'(date|datetime-local)'|\{\s*["'](date|datetime-local)["']\s*\})/;
const TYPE_ANY = /\btype=\{/;

let changedFiles = 0;
let changedTags = 0;
const review = [];

for (const file of walk(root)) {
  let src = readFileSync(file, "utf8");
  const opening = new RegExp(`<${from}(?=[\\s/>])`, "g");
  let out = "";
  let last = 0;
  let count = 0;
  const alias = /\bDateInput\b/.test(src) && !src.includes(`from "${importFrom}"`);
  const tag = alias ? "WhenDateInput" : "DateInput";
  for (const m of src.matchAll(opening)) {
    const end = tagEnd(src, m.index);
    if (end < 0) continue;
    const attrs = src.slice(m.index, end);
    if (TYPE_STATIC.test(attrs)) {
      out += src.slice(last, m.index) + `<${tag}`;
      last = m.index + m[0].length;
      count++;
      const line = src.slice(0, m.index).split("\n").length;
      if (/\{\s*\.\.\./.test(attrs))
        review.push(`${relative(root, file)}:${line} spreads props — check they are input props`);
    } else if (TYPE_ANY.test(attrs) && /date/i.test(src.slice(m.index, m.index + 400))) {
      const line = src.slice(0, m.index).split("\n").length;
      review.push(
        `${relative(root, file)}:${line} has a dynamic type={…} near "date" — decide by hand`,
      );
    }
  }
  if (count === 0) continue;
  out += src.slice(last);

  const importLine = alias
    ? `import { DateInput as WhenDateInput } from "${importFrom}";`
    : `import { DateInput } from "${importFrom}";`;
  if (!out.includes(`from "${importFrom}"`)) {
    // after the last top-level import (or the directive, or the top)
    // `[ \t]*$` ends the match at the line, so the blank line after the imports is kept.
    const imports = [...out.matchAll(/^import[\s\S]*?;[ \t]*$/gm)];
    const at = imports.length
      ? imports[imports.length - 1].index + imports[imports.length - 1][0].length
      : (/^(?:["']use (?:client|server)["'];?\s*)/.exec(out)?.[0].length ?? 0);
    out = out.slice(0, at) + (at ? "\n" : "") + importLine + (at ? "" : "\n") + out.slice(at);
  }
  changedFiles++;
  changedTags += count;
  console.log(
    `${write ? "wrote " : "would change "}${relative(root, file)}  (${count} tag${count > 1 ? "s" : ""})`,
  );
  if (write) writeFileSync(file, out);
}

console.log(
  `\n${changedTags} tag(s) in ${changedFiles} file(s)${write ? " migrated" : " (dry run — add --write)"}`,
);
if (review.length) console.log(`\nREVIEW BY HAND:\n  ${review.join("\n  ")}`);
