/**
 * Calendar arithmetic on plain strings, so a date never drifts by a time zone.
 *
 * A day is `YYYY-MM-DD` and a time of day is `HH:MM` — wall-clock values, the
 * way a person says them. They become an instant only at the very end, in ONE
 * place (`zonedToUtc`), against the zone the thing being booked is in. The
 * usual bug this avoids: `new Date("2026-10-11")` is midnight UTC, which is
 * still the 10th everywhere west of Greenwich.
 */

/** A calendar day, `YYYY-MM-DD`. */
export type ISODate = string;
/** A time of day on a 24-hour clock, `HH:MM`. */
export type WallTime = string;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string") return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

export function isWallTime(value: unknown): value is WallTime {
  return typeof value === "string" && TIME_RE.test(value);
}

function parts(date: ISODate): [number, number, number] {
  const m = DATE_RE.exec(date);
  if (!m) throw new RangeError(`not a YYYY-MM-DD date: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Midnight UTC of the day — a stable handle for arithmetic and formatting. */
export function dayAnchor(date: ISODate): Date {
  const [y, m, d] = parts(date);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromAnchor(anchor: Date): ISODate {
  return anchor.toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  const anchor = dayAnchor(date);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return fromAnchor(anchor);
}

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((dayAnchor(b).getTime() - dayAnchor(a).getTime()) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday, like `Date#getDay`. */
export function weekday(date: ISODate): number {
  return dayAnchor(date).getUTCDay();
}

/** `count` consecutive days starting with `from`. */
export function nextDays(from: ISODate, count: number): ISODate[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => addDays(from, i));
}

/** The wall-clock fields of an instant as seen in `zone`. */
function zonedFields(instant: Date, zone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const get = (type: string) =>
    Number(fmt.formatToParts(instant).find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Today's date where the provider is, not where the server or browser is. */
export function todayIn(zone: string, now: Date = new Date()): ISODate {
  const f = zonedFields(now, zone);
  return `${f.year}-${String(f.month).padStart(2, "0")}-${String(f.day).padStart(2, "0")}`;
}

/** The current wall time in `zone`, `HH:MM`. */
export function nowIn(zone: string, now: Date = new Date()): WallTime {
  const f = zonedFields(now, zone);
  return `${String(f.hour).padStart(2, "0")}:${String(f.minute).padStart(2, "0")}`;
}

function offsetMinutes(zone: string, instant: Date): number {
  const f = zonedFields(instant, zone);
  const asIfUtc = Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second);
  return Math.round((asIfUtc - instant.getTime()) / 60_000);
}

/**
 * The instant at which it is `time` on `date` in `zone`. Daylight saving is
 * handled by re-reading the offset at the candidate instant: a wall time in
 * the spring-forward gap does not exist and resolves to the instant after it.
 */
export function zonedToUtc(date: ISODate, time: WallTime, zone: string): Date {
  if (!isWallTime(time)) throw new RangeError(`not an HH:MM time: ${time}`);
  const [y, m, d] = parts(date);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  const first = wall - offsetMinutes(zone, new Date(wall)) * 60_000;
  const second = wall - offsetMinutes(zone, new Date(first)) * 60_000;
  return new Date(second);
}

export function minutesOf(time: WallTime): number {
  if (!isWallTime(time)) throw new RangeError(`not an HH:MM time: ${time}`);
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeFromMinutes(minutes: number): WallTime {
  const clamped = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}
