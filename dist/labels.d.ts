/**
 * How a day, a time and a length read to a person — in their language.
 *
 * Every string here comes from `Intl`, so "Today", "morgen" and "demain" are
 * the platform's words rather than a table this package would have to keep.
 * Days are formatted from their UTC anchor with `timeZone: "UTC"`, so the
 * label is always the day that was picked.
 */
import { type ISODate, type WallTime } from "./calendar.js";
export interface DayLabel {
    date: ISODate;
    /** "Sat" */
    weekdayShort: string;
    /** "11" */
    dayOfMonth: string;
    /** "Oct" */
    monthShort: string;
    /** "Today" / "Tomorrow" (in the locale), otherwise null. */
    relative: string | null;
    /** "Saturday, 11 October" — for screen readers and summaries. */
    long: string;
    /** "Sat 11 Oct" */
    short: string;
}
export declare function dayLabel(date: ISODate, opts?: {
    locale?: string;
    today?: ISODate;
}): DayLabel;
/** "14:00" or "2:00 PM", whichever the locale uses. */
export declare function formatTime(time: WallTime, locale?: string): string;
/** "30 min", "2 hr", "1 day" — the locale's own short unit words. */
export declare function formatLength(minutes: number, locale?: string): string;
//# sourceMappingURL=labels.d.ts.map