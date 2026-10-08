// The decisions every date/time picker must make the same way. Run against
// dist/ — the code consumers actually install.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  daysBetween,
  dayLabel,
  describeRequest,
  formatLength,
  isComplete,
  isISODate,
  lengthOptions,
  nextDays,
  resolveRequest,
  timeSlots,
  todayIn,
  weekday,
  zonedToUtc,
} from "../dist/index.js";

const ZRH = "Europe/Zurich";

test("a picked day is that day everywhere — no UTC-midnight drift", () => {
  // new Date("2026-10-11") is the 10th in New York; dayLabel must not be.
  assert.equal(dayLabel("2026-10-11", { locale: "en-US" }).dayOfMonth, "11");
  assert.equal(weekday("2026-10-11"), 0); // a Sunday
});

test("calendar arithmetic crosses months and years", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(daysBetween("2026-10-09", "2026-10-13"), 4);
  assert.deepEqual(nextDays("2026-10-30", 3), ["2026-10-30", "2026-10-31", "2026-11-01"]);
});

test("isISODate rejects days that do not exist", () => {
  assert.equal(isISODate("2026-02-30"), false);
  assert.equal(isISODate("2026-2-3"), false);
  assert.equal(isISODate("2028-02-29"), true);
});

test("today is the provider's today, not the server's", () => {
  // 23:30 UTC on the 10th is already the 11th in Zurich (UTC+2 in October).
  assert.equal(todayIn(ZRH, new Date("2026-10-10T23:30:00Z")), "2026-10-11");
  assert.equal(todayIn("America/New_York", new Date("2026-10-10T23:30:00Z")), "2026-10-10");
});

test("wall time in a zone becomes the right instant, summer and winter", () => {
  assert.equal(zonedToUtc("2026-07-01", "14:00", ZRH).toISOString(), "2026-07-01T12:00:00.000Z");
  assert.equal(zonedToUtc("2026-01-15", "09:00", ZRH).toISOString(), "2026-01-15T08:00:00.000Z");
});

test("a wall time inside the spring-forward gap resolves to a real instant after it", () => {
  // 2026-03-29 02:30 does not exist in Zurich (02:00 → 03:00).
  const instant = zonedToUtc("2026-03-29", "02:30", ZRH);
  assert.equal(instant.toISOString(), "2026-03-29T01:30:00.000Z"); // = 03:30 CEST
});

test("start times only where the whole booking still fits before closing", () => {
  const hours = { start: "09:00", end: "18:00" };
  const slots = timeSlots({ hours, lengthMinutes: 120 });
  assert.equal(slots[0], "09:00");
  assert.equal(slots.at(-1), "16:00");
  // Later today: nothing that has already started.
  assert.equal(timeSlots({ hours, notBefore: "13:20" })[0], "14:00");
  assert.deepEqual(timeSlots({ hours, notBefore: "17:30" }), []);
});

test("lengths never exceed the opening hours", () => {
  assert.deepEqual(lengthOptions({ start: "10:00", end: "13:00" }), [60, 120, 180]);
  assert.deepEqual(lengthOptions({ start: "10:00", end: "10:30" }), [30]);
});

test("an incomplete request resolves to nothing — never a guessed slot", () => {
  const opts = { zone: ZRH, today: "2026-10-10" };
  assert.equal(
    resolveRequest({ kind: "slot", date: "2026-10-11", time: null, lengthMinutes: 60 }, opts),
    null,
  );
  assert.equal(resolveRequest({ kind: "days", from: null, to: null }, opts), null);
  assert.equal(isComplete(null), false);
});

test("a slot resolves to start + length; the end is never typed", () => {
  const r = resolveRequest(
    { kind: "slot", date: "2026-10-11", time: "14:00", lengthMinutes: 120 },
    { zone: ZRH, today: "2026-10-10" },
  );
  assert.deepEqual(r, {
    startsAt: "2026-10-11T12:00:00.000Z",
    endsAt: "2026-10-11T14:00:00.000Z",
    flexible: false,
  });
});

test("days are inclusive, and a backwards range is just the first day", () => {
  const opts = { zone: ZRH, today: "2026-10-10" };
  const r = resolveRequest({ kind: "days", from: "2026-10-11", to: "2026-10-13" }, opts);
  assert.equal(r.startsAt, "2026-10-10T22:00:00.000Z"); // midnight Zurich
  assert.equal(r.endsAt, "2026-10-13T22:00:00.000Z"); // end of the 13th
  const back = resolveRequest({ kind: "days", from: "2026-10-13", to: "2026-10-11" }, opts);
  assert.equal(back.endsAt, "2026-10-13T22:00:00.000Z");
});

test("flexible always gives the server a real window and says it is flexible", () => {
  const r = resolveRequest({ kind: "flexible", date: null }, { zone: ZRH, today: "2026-10-10" });
  assert.equal(r.flexible, true);
  assert.ok(new Date(r.endsAt) > new Date(r.startsAt));
});

test("the summary sentence is what a person would say", () => {
  const today = "2026-10-10";
  assert.equal(
    describeRequest(
      { kind: "slot", date: "2026-10-11", time: "14:00", lengthMinutes: 120 },
      { locale: "en-GB", today },
    ),
    "Sun 11 Oct, 14:00–16:00 (2 hrs)",
  );
  assert.equal(
    describeRequest(
      { kind: "days", from: "2026-10-11", to: "2026-10-13" },
      { locale: "en-GB", today },
    ),
    "Sun 11 Oct – Tue 13 Oct (3 days)",
  );
  assert.match(describeRequest({ kind: "flexible", date: null }), /^Flexible/);
  assert.equal(describeRequest({ kind: "slot", date: null, time: null, lengthMinutes: null }), "");
});

test("relative day words come from the locale", () => {
  assert.equal(dayLabel("2026-10-10", { locale: "en", today: "2026-10-10" }).relative, "Today");
  assert.equal(dayLabel("2026-10-11", { locale: "de", today: "2026-10-10" }).relative, "Morgen");
  assert.equal(dayLabel("2026-10-12", { locale: "en", today: "2026-10-10" }).relative, null);
});

test("lengths read naturally", () => {
  assert.equal(formatLength(60, "en"), "1 hr");
  assert.equal(formatLength(30, "en"), "30 min");
  assert.equal(formatLength(1440, "en"), "1 day");
});
