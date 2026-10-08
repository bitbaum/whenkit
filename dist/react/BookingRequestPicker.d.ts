import { type BookingChoice, type RequestWords } from "../request.js";
import { type DailyHours } from "../slots.js";
export interface BookingPickerWords extends RequestWords {
    day: string;
    days: string;
    time: string;
    length: string;
    mode: string;
    modeExact: string;
    modeDays: string;
    modeFlexible: string;
    preferredDay: string;
    flexibleHint: string;
    noTimes: string;
    otherDate: string;
}
export declare const DEFAULT_PICKER_WORDS: BookingPickerWords;
export interface BookingRequestPickerProps {
    unit: "hour" | "day";
    /** IANA zone of the thing being booked, e.g. "Europe/Zurich". */
    zone: string;
    locale?: string;
    value: BookingChoice | null;
    onChange: (choice: BookingChoice) => void;
    /** Opening hours for hourly bookings. */
    hours?: DailyHours;
    /** Weekdays open, 0 = Sunday … 6 = Saturday. Omit for every day. */
    openWeekdays?: number[];
    /** Spacing of start times, minutes. */
    stepMinutes?: number;
    /** Days shown as chips. */
    daysAhead?: number;
    allowFlexible?: boolean;
    words?: Partial<BookingPickerWords>;
    /** For tests and demos; defaults to now. */
    now?: Date;
}
export declare function BookingRequestPicker({ unit, zone, locale, value, onChange, hours, openWeekdays, stepMinutes, daysAhead, allowFlexible, words: wordOverrides, now, }: BookingRequestPickerProps): import("react").JSX.Element;
//# sourceMappingURL=BookingRequestPicker.d.ts.map