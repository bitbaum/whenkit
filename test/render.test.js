// The components render on the server (Next RSC/SSR) with the semantics a
// screen reader needs. A picker that cannot render without a browser breaks
// every Next page it is put on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { BookingRequestPicker, DateField, ChipGroup, DateInput } from "../dist/react/index.js";

const NOW = new Date("2026-10-10T08:00:00Z"); // 10:00 in Zurich, a Saturday
const base = { zone: "Europe/Zurich", locale: "en-GB", now: NOW, onChange: () => {} };

test("hourly picker: day strip first, no times until a day is chosen", () => {
  const html = renderToString(h(BookingRequestPicker, { ...base, unit: "hour", value: null }));
  assert.match(html, /Today/);
  assert.match(html, /Tomorrow/);
  assert.doesNotMatch(html, /role="radiogroup" aria-label="Start"/);
});

test("hourly picker with a day: start times are a radio group and none is in the past", () => {
  const html = renderToString(
    h(BookingRequestPicker, {
      ...base,
      unit: "hour",
      value: { kind: "slot", date: "2026-10-10", time: null, lengthMinutes: 60 },
    }),
  );
  assert.match(html, /role="radiogroup" aria-label="Start"/);
  assert.doesNotMatch(html, />09:00</); // already past at 10:00
  assert.match(html, />11:00</);
});

test("a complete request shows the one summary line", () => {
  const html = renderToString(
    h(BookingRequestPicker, {
      ...base,
      unit: "hour",
      value: { kind: "slot", date: "2026-10-11", time: "14:00", lengthMinutes: 120 },
    }),
  );
  assert.match(html, /class="wk-summary" aria-live="polite">Sun 11 Oct, 14:00–16:00/);
});

test("daily picker never asks for a time", () => {
  const html = renderToString(
    h(BookingRequestPicker, {
      ...base,
      unit: "day",
      value: { kind: "days", from: "2026-10-11", to: "2026-10-13" },
    }),
  );
  assert.doesNotMatch(html, /aria-label="Start"/);
  assert.match(html, /\(3 days\)/);
});

test("closed weekdays cannot be picked", () => {
  // Open Mon–Fri only: Saturday 10 and Sunday 11 are disabled.
  const html = renderToString(
    h(BookingRequestPicker, { ...base, unit: "day", value: null, openWeekdays: [1, 2, 3, 4, 5] }),
  );
  assert.match(html, /aria-label="Today, Saturday 10 October"[^>]*disabled/);
});

test("flexible is offered and can carry no day at all", () => {
  const html = renderToString(
    h(BookingRequestPicker, { ...base, unit: "hour", value: { kind: "flexible", date: null } }),
  );
  assert.match(html, /role="radio" aria-checked="true"[^>]*>I&#x27;m flexible</);
  assert.match(html, /Flexible — the provider suggests a time/);
});

test("DateField shows words, keeps the native control labelled underneath", () => {
  const html = renderToString(
    h(DateField, { label: "Deadline", value: "2026-10-11", onChange: () => {}, locale: "en-GB" }),
  );
  assert.match(html, /Sun, 11 Oct 2026/);
  assert.match(html, /<label class="wk-label" for="[^"]+">Deadline<\/label>/);
  assert.match(html, /type="date"/);
});

test("ChipGroup is a radiogroup with one tab stop", () => {
  const html = renderToString(
    h(ChipGroup, {
      label: "Length",
      value: 60,
      onChange: () => {},
      options: [
        { value: 60, label: "1 hr" },
        { value: 120, label: "2 hrs" },
      ],
    }),
  );
  assert.equal((html.match(/tabindex="0"/g) ?? []).length, 1);
  assert.match(html, /role="radio" aria-checked="true"/);
});

test("a fixed duration shows no length choice and is used for the slot", () => {
  const html = renderToString(
    h(BookingRequestPicker, {
      ...base,
      unit: "hour",
      lengths: [90],
      value: { kind: "slot", date: "2026-10-11", time: "14:00", lengthMinutes: 90 },
    }),
  );
  assert.doesNotMatch(html, /aria-label="For how long"/);
  assert.match(html, /14:00–15:30/);
  // 17:00 + 90 min would end after 18:00 closing, so it is not offered.
  assert.doesNotMatch(html, />17:00</);
});

test("DateInput is a drop-in: every input prop reaches the real input, className the visible box", () => {
  const html = renderToString(
    h(DateInput, {
      id: "due",
      name: "due",
      required: true,
      min: "2026-10-01",
      disabled: true,
      "aria-invalid": true,
      className: "ui-input-compact",
      value: "2026-10-11",
      onChange: () => {},
      locale: "en-GB",
    }),
  );
  assert.match(html, /<span class="wk-input ui-input-compact"/);
  assert.match(html, /<input[^>]*id="due"/);
  assert.match(html, /<input[^>]*name="due"/);
  assert.match(html, /<input[^>]*required/);
  assert.match(html, /<input[^>]*min="2026-10-01"/);
  assert.match(html, /<input[^>]*disabled/);
  assert.match(html, /<input[^>]*aria-invalid="true"/);
  assert.match(html, /<input[^>]*type="date"/);
  assert.match(html, /Sun, 11 Oct 2026/);
  assert.match(html, /data-invalid/);
});

test("DateInput works uncontrolled (a server-action form): defaultValue shows and submits", () => {
  const html = renderToString(
    h(DateInput, { name: "date", defaultValue: "2026-03-05", locale: "de" }),
  );
  assert.match(html, /Do\., 5\. März 2026|Do, 5\. März 2026/);
  assert.match(html, /<input[^>]*value="2026-03-05"/);
  assert.match(html, /<input[^>]*name="date"/);
});

test("DateInput datetime-local shows the time, and an empty one shows words in the page language", () => {
  const withTime = renderToString(
    h(DateInput, {
      type: "datetime-local",
      value: "2026-10-11T14:30",
      onChange: () => {},
      locale: "en-GB",
    }),
  );
  assert.match(withTime, /Sun, 11 Oct 2026 · 14:30/);
  const empty = renderToString(h(DateInput, { value: "", onChange: () => {}, locale: "de" }));
  assert.match(empty, /Datum wählen/);
  assert.match(empty, /data-empty/);
  const unknown = renderToString(h(DateInput, { value: "", onChange: () => {}, locale: "xx" }));
  assert.match(unknown, /Pick a date/);
});

test("DateInput never throws on a bad value or a bad locale", () => {
  assert.doesNotThrow(() =>
    renderToString(
      h(DateInput, { value: "not-a-date", onChange: () => {}, locale: "zz-INVALID-tag-!!" }),
    ),
  );
});
