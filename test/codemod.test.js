// The migration codemod must change the TAG and one import line — nothing else —
// and must never touch an input that is not a date.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/migrate-date-inputs.mjs", import.meta.url));
const IMPORT = "@/components/ui/date-input";

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), "whenkit-codemod-"));
  for (const [name, body] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
}
const run = (dir, extra = []) =>
  execFileSync("node", [script, dir, "--import", IMPORT, ...extra], { encoding: "utf8" });
const read = (dir, name) => readFileSync(join(dir, name), "utf8");

test("a dry run reports and writes nothing", () => {
  const dir = project({
    "a.tsx": `import x from "x";\nexport const A = () => <input type="date" value={v} />;\n`,
  });
  const before = read(dir, "a.tsx");
  const out = run(dir);
  assert.match(out, /would change a\.tsx/);
  assert.match(out, /dry run/);
  assert.equal(read(dir, "a.tsx"), before);
});

test("only the tag changes; props, arrows, strings and templates are untouched", () => {
  const body = `"use client";
import { useState } from "react";

export function F() {
  const [d, setD] = useState("");
  return (
    <input
      type="date"
      value={d}
      onChange={(e) => setD(e.target.value)}
      className={\`ui-input \${d ? "set" : ""}\`}
      title="a > b"
      min={new Date().toISOString().slice(0, 10)}
    />
  );
}
`;
  const dir = project({ "f.tsx": body });
  run(dir, ["--write"]);
  const after = read(dir, "f.tsx");
  assert.match(after, /<DateInput\n\s+type="date"/);
  assert.match(after, /onChange=\{\(e\) => setD\(e\.target\.value\)\}/);
  assert.match(after, /className=\{`ui-input \$\{d \? "set" : ""\}`\}/);
  assert.match(after, /title="a > b"/);
  // the import goes after the last import, below the directive
  assert.match(
    after,
    /"use client";\nimport \{ useState \} from "react";\nimport \{ DateInput \} from "@\/components\/ui\/date-input";\n/,
  );
  // and the diff is exactly one tag and one import
  assert.equal(
    after
      .replace('import { DateInput } from "@/components/ui/date-input";\n', "")
      .replace("<DateInput", "<input"),
    body,
  );
});

test("datetime-local, single-quoted and braced types are all converted", () => {
  const dir = project({
    "a.tsx": `import x from "x";\nexport const A = () => (<><input type='datetime-local' /><input type={"date"} /><input type="date"/></>);\n`,
  });
  run(dir, ["--write"]);
  assert.equal((read(dir, "a.tsx").match(/<DateInput/g) ?? []).length, 3);
});

test("inputs that are not dates are left exactly alone", () => {
  const body = `import x from "x";\nexport const A = () => (<><input type="text" /><input type="time" /><input /><input type={kind} /></>);\n`;
  const dir = project({ "a.tsx": body });
  const out = run(dir, ["--write"]);
  assert.equal(read(dir, "a.tsx"), body);
  assert.match(out, /0 tag\(s\) in 0 file\(s\)/);
});

test("a name clash gets an alias instead of shadowing the local DateInput", () => {
  const dir = project({
    "a.tsx": `import x from "x";\nfunction DateInput() { return <input type="date" />; }\nexport { DateInput };\n`,
  });
  run(dir, ["--write"]);
  const after = read(dir, "a.tsx");
  assert.match(after, /import \{ DateInput as WhenDateInput \} from/);
  assert.match(after, /<WhenDateInput type="date" \/>/);
  assert.match(after, /function DateInput\(\)/);
});

test("--from converts a wrapper component and leaves the raw input alone", () => {
  const dir = project({
    "a.tsx": `import x from "x";\nexport const A = () => (<><Input type="date" /><input type="date" /></>);\n`,
  });
  run(dir, ["--write", "--from", "Input"]);
  const after = read(dir, "a.tsx");
  assert.match(after, /<DateInput type="date" \/>/);
  assert.match(after, /<input type="date" \/>/);
});

test("a second run changes nothing, and tests, node_modules and non-JSX are skipped", () => {
  const dir = project({
    "a.tsx": `import x from "x";\nexport const A = () => <input type="date" />;\n`,
    "a.test.tsx": `export const T = () => <input type="date" />;\n`,
    "node_modules/p/i.tsx": `export const N = () => <input type="date" />;\n`,
    "b.ts": `const s = '<input type="date" />';\n`,
  });
  run(dir, ["--write"]);
  const out = run(dir, ["--write"]);
  assert.match(out, /0 tag\(s\) in 0 file\(s\)/);
  assert.match(read(dir, "a.test.tsx"), /<input type="date"/);
  assert.match(read(dir, "node_modules/p/i.tsx"), /<input type="date"/);
  assert.match(read(dir, "b.ts"), /<input type="date"/);
});

test("risky shapes are listed for a human, not guessed", () => {
  const dir = project({
    "a.tsx": `import x from "x";\nexport const A = () => (<><input type="date" {...register("when")} /><input type={isDate ? "date" : "text"} /></>);\n`,
  });
  const out = run(dir);
  assert.match(out, /REVIEW BY HAND/);
  assert.match(out, /spreads props/);
  assert.match(out, /dynamic type=/);
});
