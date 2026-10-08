"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * A drop-in for `<input type="date">` and `<input type="datetime-local">`.
 *
 * Same props, same `onChange(event)` — a call site changes its tag and
 * nothing else. What changes is what a person sees: the browser's bare field
 * ("tt.mm.jjjj, --:--", different in every browser) is replaced by the value
 * in words ("Sat, 11 Oct 2026 · 14:00") in the app's OWN input styling (its
 * `className` lands on the visible box), while the real input stays on top,
 * transparent, so the platform picker, keyboard entry, autofill, validation
 * bubbles and form submission all keep working.
 *
 * Controlled (`value`) or uncontrolled (`defaultValue`, e.g. a server-action
 * form): the visible text follows whichever the app uses.
 */
import { forwardRef, useEffect, useState, } from "react";
import { isISODate, isWallTime } from "../calendar.js";
import { formatTime } from "../labels.js";
const EMPTY_WORDS = {
    en: ["Pick a date", "Pick a date and time"],
    de: ["Datum wählen", "Datum und Uhrzeit wählen"],
    fr: ["Choisir une date", "Choisir la date et l'heure"],
    it: ["Scegli una data", "Scegli data e ora"],
    es: ["Elegir fecha", "Elegir fecha y hora"],
};
export function emptyWords(locale, withTime) {
    const words = EMPTY_WORDS[locale.toLowerCase().split("-")[0]] ?? EMPTY_WORDS.en;
    return words[withTime ? 1 : 0];
}
/** "Sat, 11 Oct 2026" or "Sat, 11 Oct 2026 · 14:00"; "" when not a valid value. */
export function describeValue(value, withTime, locale = "en") {
    const [date, time] = value.split("T");
    if (!isISODate(date))
        return "";
    const day = new Intl.DateTimeFormat(locale, {
        timeZone: "UTC",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(`${date}T00:00:00Z`));
    return withTime && isWallTime(time) ? `${day} · ${formatTime(time, locale)}` : day;
}
/** An unknown tag from <html lang> must never throw during render. */
function safeDescribe(value, withTime, locale) {
    try {
        return describeValue(value, withTime, locale);
    }
    catch {
        return describeValue(value, withTime, "en");
    }
}
export const DateInput = forwardRef(function DateInput({ type = "date", value, defaultValue, onChange, placeholder, locale, className, style, onClick, ...rest }, ref) {
    const withTime = type === "datetime-local";
    const [inner, setInner] = useState(defaultValue ?? "");
    const [lang, setLang] = useState(locale ?? "en");
    useEffect(() => {
        if (locale)
            setLang(locale);
        else
            setLang(document.documentElement.lang || "en");
    }, [locale]);
    const current = value ?? inner;
    const text = current ? safeDescribe(current, withTime, lang) : "";
    const empty = !text;
    const handleClick = (event) => {
        onClick?.(event);
        if (event.defaultPrevented)
            return;
        try {
            event.currentTarget.showPicker?.();
        }
        catch {
            // Not permitted here (e.g. a cross-origin frame): native focus still works.
        }
    };
    return (_jsxs("span", { className: ["wk-input", className].filter(Boolean).join(" "), "data-empty": empty || undefined, "data-disabled": rest.disabled || undefined, "data-invalid": rest["aria-invalid"] === true || rest["aria-invalid"] === "true" || undefined, style: style, children: [_jsx("span", { className: "wk-input-text", "aria-hidden": "true", children: text || placeholder || emptyWords(lang, withTime) }), _jsxs("svg", { className: "wk-input-icon", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false", children: [_jsx("rect", { x: "3.5", y: "5", width: "17", height: "15", rx: "2.5", fill: "none", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M3.5 9.5h17M8 3v4M16 3v4", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" })] }), _jsx("input", { ...rest, ref: ref, type: type, className: "wk-input-native", ...(value !== undefined ? { value } : { defaultValue }), onClick: handleClick, onChange: (event) => {
                    setInner(event.target.value);
                    onChange?.(event);
                } })] }));
});
//# sourceMappingURL=DateInput.js.map