"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * A labelled date (or date + time) field: `DateInput` with its own label and
 * an optional hint, for places that do not already have a form-field wrapper.
 * Apps that do (most) use `DateInput` directly.
 *
 * Values are `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM` wall-clock strings — exactly
 * what the native input speaks — never instants.
 */
import { useId } from "react";
import { DateInput, describeValue } from "./DateInput.js";
/** Kept for callers of 0.1–0.2: the words for a value, or "" if invalid. */
export const describeFieldValue = describeValue;
export function DateField({ label, value, onChange, withTime = false, min, max, required, name, placeholder, locale, hint, className, }) {
    const id = useId();
    return (_jsxs("div", { className: ["wk-field", className].filter(Boolean).join(" "), children: [_jsx("label", { className: "wk-label", htmlFor: id, children: label }), _jsx(DateInput, { id: id, type: withTime ? "datetime-local" : "date", value: value, onChange: (e) => onChange(e.target.value), min: min, max: max, required: required, name: name, placeholder: placeholder, locale: locale, "aria-describedby": hint ? `${id}-hint` : undefined }), hint && (_jsx("p", { className: "wk-hint", id: `${id}-hint`, children: hint }))] }));
}
//# sourceMappingURL=DateField.js.map