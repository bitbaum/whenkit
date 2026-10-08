"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { nowIn, todayIn, weekday } from "../calendar.js";
import { formatLength, formatTime } from "../labels.js";
import { describeRequest } from "../request.js";
import { DEFAULT_HOURS, lengthOptions, timeSlots } from "../slots.js";
import { ChipGroup } from "./ChipGroup.js";
import { DayStrip } from "./DayStrip.js";
export const DEFAULT_PICKER_WORDS = {
    flexible: "Flexible — the provider suggests a time",
    flexibleAround: "Flexible, around",
    day: "Day",
    days: "Days — tap a second day for more than one",
    time: "Start",
    length: "For how long",
    mode: "When",
    modeExact: "Pick a time",
    modeDays: "Pick days",
    modeFlexible: "I'm flexible",
    preferredDay: "Preferred day (optional)",
    flexibleHint: "Add what suits you in the note — the provider will propose a time.",
    noTimes: "No start times left on this day — pick another.",
    otherDate: "Another date…",
};
function emptyFor(unit) {
    return unit === "day"
        ? { kind: "days", from: null, to: null }
        : { kind: "slot", date: null, time: null, lengthMinutes: null };
}
export function BookingRequestPicker({ unit, zone, locale = "en", value, onChange, hours = DEFAULT_HOURS, openWeekdays, stepMinutes = 60, daysAhead = 14, allowFlexible = true, words: wordOverrides, now, }) {
    const words = { ...DEFAULT_PICKER_WORDS, ...wordOverrides };
    const instant = now ?? new Date();
    const today = todayIn(zone, instant);
    const choice = value ?? emptyFor(unit);
    const flexible = choice.kind === "flexible";
    const closed = (d) => (openWeekdays ? !openWeekdays.includes(weekday(d)) : false);
    const modeChips = allowFlexible ? (_jsx(ChipGroup, { label: words.mode, hideLabel: true, value: flexible ? "flexible" : "exact", options: [
            { value: "exact", label: unit === "day" ? words.modeDays : words.modeExact },
            { value: "flexible", label: words.modeFlexible },
        ], onChange: (m) => onChange(m === "flexible" ? { kind: "flexible", date: null } : emptyFor(unit)) })) : null;
    let body;
    if (choice.kind === "flexible") {
        body = (_jsxs(_Fragment, { children: [_jsx(DayStrip, { label: words.preferredDay, today: today, days: daysAhead, locale: locale, value: choice.date, allowClear: true, isDisabled: closed, otherDateLabel: words.otherDate, onChange: ({ date }) => onChange({ kind: "flexible", date }) }), _jsx("p", { className: "wk-hint", children: words.flexibleHint })] }));
    }
    else if (choice.kind === "days") {
        body = (_jsx(DayStrip, { label: words.days, today: today, days: daysAhead, locale: locale, mode: "range", from: choice.from, to: choice.to, isDisabled: closed, otherDateLabel: words.otherDate, onChange: ({ from, to }) => onChange({ kind: "days", from, to }) }));
    }
    else {
        const lengths = lengthOptions(hours);
        const length = choice.lengthMinutes ?? lengths[0];
        const slots = choice.date
            ? timeSlots({
                hours,
                stepMinutes,
                lengthMinutes: length,
                notBefore: choice.date === today ? nowIn(zone, instant) : null,
            })
            : [];
        body = (_jsxs(_Fragment, { children: [_jsx(DayStrip, { label: words.day, today: today, days: daysAhead, locale: locale, value: choice.date, isDisabled: closed, otherDateLabel: words.otherDate, onChange: ({ date }) => onChange({
                        kind: "slot",
                        date,
                        time: null,
                        lengthMinutes: choice.lengthMinutes ?? length,
                    }) }), choice.date &&
                    (slots.length > 0 ? (_jsx(ChipGroup, { label: words.time, value: choice.time, options: slots.map((t) => ({ value: t, label: formatTime(t, locale) })), onChange: (time) => onChange({ ...choice, time, lengthMinutes: length }) })) : (_jsx("p", { className: "wk-hint", role: "status", children: words.noTimes }))), choice.date && slots.length > 0 && (_jsx(ChipGroup, { label: words.length, value: length, options: lengths.map((m) => ({ value: m, label: formatLength(m, locale) })), onChange: (lengthMinutes) => {
                        // A longer booking may no longer fit after the chosen start.
                        const fits = timeSlots({
                            hours,
                            stepMinutes,
                            lengthMinutes,
                            notBefore: choice.date === today ? nowIn(zone, instant) : null,
                        });
                        const time = choice.time && fits.includes(choice.time) ? choice.time : null;
                        onChange({ ...choice, time, lengthMinutes });
                    } }))] }));
    }
    const summary = describeRequest(choice, { locale, today, words });
    return (_jsxs("div", { className: "wk-picker", children: [modeChips, body, _jsx("p", { className: "wk-summary", "aria-live": "polite", "data-empty": summary ? undefined : true, children: summary })] }));
}
//# sourceMappingURL=BookingRequestPicker.js.map