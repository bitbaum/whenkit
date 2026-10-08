/**
 * The next two weeks as tappable day chips — "Today", "Tomorrow", "Fri 10" —
 * plus "Another date…" for anything further out (the native picker, via
 * DateField). Most bookings are for the next few days; a calendar grid makes
 * the common case three taps and a scroll.
 *
 * `range` mode selects from–to: the first tap sets the start, the second
 * (later) tap the end, a tap on or before the start starts over.
 */
import { type ISODate } from "../calendar.js";
export interface DayStripProps {
    label: string;
    today: ISODate;
    /** How many days to show as chips. */
    days?: number;
    locale?: string;
    /** Single day: `value`. Range: `from` / `to`. */
    mode?: "single" | "range";
    value?: ISODate | null;
    from?: ISODate | null;
    to?: ISODate | null;
    onChange: (next: {
        date: ISODate | null;
        from: ISODate | null;
        to: ISODate | null;
    }) => void;
    /** Days that cannot be picked (closed, booked). */
    isDisabled?: (date: ISODate) => boolean;
    /** Allow deselecting the chosen day (used for "flexible, no preference"). */
    allowClear?: boolean;
    otherDateLabel?: string;
}
export declare function DayStrip({ label, today, days, locale, mode, value, from, to, onChange, isDisabled, allowClear, otherDateLabel, }: DayStripProps): import("react").JSX.Element;
//# sourceMappingURL=DayStrip.d.ts.map