/**
 * What a person can tap: start times inside opening hours, and lengths.
 *
 * Offering only times that fit is the point — a free time field lets someone
 * ask for 23:30 at a studio that closes at 18:00 and learn it from a
 * rejection a day later.
 */
import { minutesOf, timeFromMinutes, type WallTime } from "./calendar.js";

export interface DailyHours {
  start: WallTime;
  end: WallTime;
}

/** Used when a listing has not said when it is open. */
export const DEFAULT_HOURS: DailyHours = { start: "09:00", end: "18:00" };

/**
 * Start times from `hours.start`, every `stepMinutes`, such that a booking of
 * `lengthMinutes` still ends by `hours.end`. `notBefore` drops times already
 * past (pass the provider's current time when the day is today).
 */
export function timeSlots(opts: {
  hours?: DailyHours;
  stepMinutes?: number;
  lengthMinutes?: number;
  notBefore?: WallTime | null;
}): WallTime[] {
  const hours = opts.hours ?? DEFAULT_HOURS;
  const step = Math.max(5, opts.stepMinutes ?? 60);
  const length = Math.max(0, opts.lengthMinutes ?? step);
  const open = minutesOf(hours.start);
  const close = minutesOf(hours.end);
  const floor = opts.notBefore ? minutesOf(opts.notBefore) : -1;
  const out: WallTime[] = [];
  for (let t = open; t + length <= close; t += step) {
    if (t > floor) out.push(timeFromMinutes(t));
  }
  return out;
}

/** Lengths offered for an hourly booking, in minutes, that fit the day. */
export const HOURLY_LENGTHS = [60, 120, 180, 240, 480] as const;

export function lengthOptions(hours: DailyHours = DEFAULT_HOURS): number[] {
  const span = minutesOf(hours.end) - minutesOf(hours.start);
  const fitting = HOURLY_LENGTHS.filter((m) => m <= span);
  return fitting.length > 0 ? fitting : [Math.max(30, span)];
}
