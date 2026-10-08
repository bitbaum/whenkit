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
import { addDays, daysBetween, isISODate, isWallTime, minutesOf, timeFromMinutes, zonedToUtc, } from "./calendar.js";
import { dayLabel, formatLength, formatTime } from "./labels.js";
/** Everything the choice needs before it can be sent. */
export function isComplete(choice) {
    if (!choice)
        return false;
    switch (choice.kind) {
        case "slot":
            return (isISODate(choice.date) &&
                isWallTime(choice.time) &&
                typeof choice.lengthMinutes === "number" &&
                choice.lengthMinutes > 0);
        case "days":
            return isISODate(choice.from) && (choice.to === null || isISODate(choice.to));
        case "flexible":
            return true;
    }
}
/**
 * The instants for a complete choice; null while it is incomplete.
 * A flexible request without a day spans the preferred day, or today, so the
 * server always receives a real window; `flexible` says it is not a slot.
 */
export function resolveRequest(choice, opts) {
    if (!choice || !isComplete(choice))
        return null;
    switch (choice.kind) {
        case "slot": {
            const start = zonedToUtc(choice.date, choice.time, opts.zone);
            const end = new Date(start.getTime() + choice.lengthMinutes * 60_000);
            return { startsAt: start.toISOString(), endsAt: end.toISOString(), flexible: false };
        }
        case "days": {
            const from = choice.from;
            const to = choice.to && daysBetween(from, choice.to) >= 0 ? choice.to : from;
            return {
                startsAt: zonedToUtc(from, "00:00", opts.zone).toISOString(),
                endsAt: zonedToUtc(addDays(to, 1), "00:00", opts.zone).toISOString(),
                flexible: false,
            };
        }
        case "flexible": {
            const day = choice.date ?? opts.today;
            return {
                startsAt: zonedToUtc(day, "00:00", opts.zone).toISOString(),
                endsAt: zonedToUtc(addDays(day, 1), "00:00", opts.zone).toISOString(),
                flexible: true,
            };
        }
    }
}
export const DEFAULT_WORDS = {
    flexible: "Flexible — the provider suggests a time",
    flexibleAround: "Flexible, around",
};
/**
 * The sentence a person checks before sending, and the provider reads:
 * "Sat 11 Oct, 14:00–16:00 (2 hr)", "Sat 11 – Mon 13 Oct (3 days)".
 * Empty string while the choice is incomplete.
 */
export function describeRequest(choice, opts = {}) {
    if (!choice || !isComplete(choice))
        return "";
    const locale = opts.locale ?? "en";
    const words = { ...DEFAULT_WORDS, ...opts.words };
    const day = (d) => dayLabel(d, { locale, today: opts.today });
    switch (choice.kind) {
        case "slot": {
            const length = choice.lengthMinutes;
            const endMinutes = minutesOf(choice.time) + length;
            const range = endMinutes < 24 * 60
                ? `${formatTime(choice.time, locale)}–${formatTime(timeFromMinutes(endMinutes), locale)}`
                : formatTime(choice.time, locale);
            return `${day(choice.date).short}, ${range} (${formatLength(length, locale)})`;
        }
        case "days": {
            const from = choice.from;
            const to = choice.to && daysBetween(from, choice.to) > 0 ? choice.to : null;
            if (!to)
                return `${day(from).short} (${formatLength(24 * 60, locale)})`;
            const count = daysBetween(from, to) + 1;
            return `${day(from).short} – ${day(to).short} (${formatLength(count * 24 * 60, locale)})`;
        }
        case "flexible":
            return choice.date ? `${words.flexibleAround} ${day(choice.date).short}` : words.flexible;
    }
}
//# sourceMappingURL=request.js.map