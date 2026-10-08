/**
 * A booking request as a person makes it, and the two instants a server needs.
 *
 * Nobody should have to type an end time. A request is one of three choices,
 * and the instants are derived:
 *  - slot     — a day, a start time and a length (hourly things)
 *  - days     — from one day to another, inclusive (things rented by the day)
 *  - flexible — at most a preferred day; the provider proposes the time
 *
 * `resolveRequest` is the ONE place a choice becomes `{startsAt, endsAt}`, in
 * the zone of the thing being booked.
 */
import { type ISODate, type WallTime } from "./calendar.js";
export type BookingChoice = {
    kind: "slot";
    date: ISODate | null;
    time: WallTime | null;
    lengthMinutes: number | null;
} | {
    kind: "days";
    from: ISODate | null;
    to: ISODate | null;
} | {
    kind: "flexible";
    date: ISODate | null;
};
export interface ResolvedRequest {
    /** ISO 8601 instant. */
    startsAt: string;
    /** ISO 8601 instant, after `startsAt`. */
    endsAt: string;
    /** True when the customer left the time to the provider. */
    flexible: boolean;
}
/** Everything the choice needs before it can be sent. */
export declare function isComplete(choice: BookingChoice | null | undefined): boolean;
/**
 * The instants for a complete choice; null while it is incomplete.
 * A flexible request without a day spans the preferred day, or today, so the
 * server always receives a real window; `flexible` says it is not a slot.
 */
export declare function resolveRequest(choice: BookingChoice | null | undefined, opts: {
    zone: string;
    today: ISODate;
}): ResolvedRequest | null;
export interface RequestWords {
    /** Shown for a flexible request with no day. */
    flexible: string;
    /** Prefix for a flexible request with a preferred day, e.g. "Flexible, around". */
    flexibleAround: string;
}
export declare const DEFAULT_WORDS: RequestWords;
/**
 * The sentence a person checks before sending, and the provider reads:
 * "Sat 11 Oct, 14:00–16:00 (2 hr)", "Sat 11 – Mon 13 Oct (3 days)".
 * Empty string while the choice is incomplete.
 */
export declare function describeRequest(choice: BookingChoice | null | undefined, opts?: {
    locale?: string;
    today?: ISODate;
    words?: Partial<RequestWords>;
}): string;
//# sourceMappingURL=request.d.ts.map