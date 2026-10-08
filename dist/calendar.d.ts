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
export declare function isISODate(value: unknown): value is ISODate;
export declare function isWallTime(value: unknown): value is WallTime;
/** Midnight UTC of the day — a stable handle for arithmetic and formatting. */
export declare function dayAnchor(date: ISODate): Date;
export declare function addDays(date: ISODate, days: number): ISODate;
/** Whole days from `a` to `b` (negative when `b` is earlier). */
export declare function daysBetween(a: ISODate, b: ISODate): number;
/** 0 = Sunday … 6 = Saturday, like `Date#getDay`. */
export declare function weekday(date: ISODate): number;
/** `count` consecutive days starting with `from`. */
export declare function nextDays(from: ISODate, count: number): ISODate[];
/** Today's date where the provider is, not where the server or browser is. */
export declare function todayIn(zone: string, now?: Date): ISODate;
/** The current wall time in `zone`, `HH:MM`. */
export declare function nowIn(zone: string, now?: Date): WallTime;
/**
 * The instant at which it is `time` on `date` in `zone`. Daylight saving is
 * handled by re-reading the offset at the candidate instant: a wall time in
 * the spring-forward gap does not exist and resolves to the instant after it.
 */
export declare function zonedToUtc(date: ISODate, time: WallTime, zone: string): Date;
export declare function minutesOf(time: WallTime): number;
export declare function timeFromMinutes(minutes: number): WallTime;
//# sourceMappingURL=calendar.d.ts.map