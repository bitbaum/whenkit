"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The next two weeks as tappable day chips — "Today", "Tomorrow", "Fri 10" —
 * plus "Another date…" for anything further out (the native picker, via
 * DateField). Most bookings are for the next few days; a calendar grid makes
 * the common case three taps and a scroll.
 *
 * `range` mode selects from–to: the first tap sets the start, the second
 * (later) tap the end, a tap on or before the start starts over.
 */
import { addDays, daysBetween, nextDays } from "../calendar.js";
import { dayLabel } from "../labels.js";
import { DateField } from "./DateField.js";
export function DayStrip({ label, today, days = 14, locale = "en", mode = "single", value = null, from = null, to = null, onChange, isDisabled, allowClear = false, otherDateLabel = "Another date…", }) {
    const strip = nextDays(today, days);
    const last = strip[strip.length - 1];
    const isSelected = (d) => {
        if (mode === "single")
            return d === value;
        if (!from)
            return false;
        if (!to)
            return d === from;
        return daysBetween(from, d) >= 0 && daysBetween(d, to) >= 0;
    };
    const pick = (d) => {
        if (mode === "single") {
            const next = allowClear && d === value ? null : d;
            onChange({ date: next, from: null, to: null });
            return;
        }
        if (!from || to || daysBetween(from, d) <= 0) {
            onChange({ date: null, from: d, to: null });
        }
        else {
            onChange({ date: null, from, to: d });
        }
    };
    // A date picked beyond the strip is still shown, as its own chip.
    const picked = mode === "single" ? value : (to ?? from);
    const outside = picked && daysBetween(last, picked) > 0 ? picked : null;
    return (_jsxs("div", { className: "wk-group", children: [_jsx("span", { className: "wk-label", children: label }), _jsx("div", { className: "wk-strip", role: "group", "aria-label": label, children: [...strip, ...(outside ? [outside] : [])].map((d) => {
                    const l = dayLabel(d, { locale, today });
                    const disabled = isDisabled?.(d) ?? false;
                    const selected = isSelected(d);
                    return (_jsxs("button", { type: "button", className: "wk-day", "aria-pressed": selected, "aria-label": l.relative ? `${l.relative}, ${l.long}` : l.long, "data-selected": selected || undefined, "data-edge": mode === "range" && from && to && (d === from || d === to) ? true : undefined, disabled: disabled, onClick: () => pick(d), children: [_jsx("span", { className: "wk-day-top", children: l.relative ?? l.weekdayShort }), _jsx("span", { className: "wk-day-num", children: l.dayOfMonth }), _jsx("span", { className: "wk-day-bottom", children: l.monthShort })] }, d));
                }) }), _jsx(DateField, { className: "wk-other", label: otherDateLabel, value: "", min: addDays(today, 0), locale: locale, placeholder: otherDateLabel, onChange: (v) => {
                    if (v && !(isDisabled?.(v) ?? false))
                        pick(v);
                } })] }));
}
//# sourceMappingURL=DayStrip.js.map