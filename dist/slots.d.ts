/**
 * What a person can tap: start times inside opening hours, and lengths.
 *
 * Offering only times that fit is the point — a free time field lets someone
 * ask for 23:30 at a studio that closes at 18:00 and learn it from a
 * rejection a day later.
 */
import { type WallTime } from "./calendar.js";
export interface DailyHours {
    start: WallTime;
    end: WallTime;
}
/** Used when a listing has not said when it is open. */
export declare const DEFAULT_HOURS: DailyHours;
/**
 * Start times from `hours.start`, every `stepMinutes`, such that a booking of
 * `lengthMinutes` still ends by `hours.end`. `notBefore` drops times already
 * past (pass the provider's current time when the day is today).
 */
export declare function timeSlots(opts: {
    hours?: DailyHours;
    stepMinutes?: number;
    lengthMinutes?: number;
    notBefore?: WallTime | null;
}): WallTime[];
/** Lengths offered for an hourly booking, in minutes, that fit the day. */
export declare const HOURLY_LENGTHS: readonly [60, 120, 180, 240, 480];
export declare function lengthOptions(hours?: DailyHours): number[];
//# sourceMappingURL=slots.d.ts.map