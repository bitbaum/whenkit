"use client";

/**
 * A date (or date + time) field that reads like a sentence and picks like the
 * phone does.
 *
 * The native picker is the best one there is on a phone — what looked bad
 * across the fleet was the raw field around it: the browser's locale
 * placeholder ("tt.mm.jjjj, --:--"), unstyled, different in every browser.
 * So the native input stays (keyboard entry, a11y, autofill all keep
 * working) and sits transparently over a display that says "Sat, 11 Oct ·
 * 14:00". A tap anywhere opens the platform picker via `showPicker()`.
 *
 * Values are `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM` wall-clock strings — exactly
 * what the native input speaks — never instants.
 */
import { useId } from "react";
import { dayLabel, formatTime } from "../labels.js";
import { isISODate, isWallTime } from "../calendar.js";

export interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD` (date) or `YYYY-MM-DDTHH:MM` (withTime), or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  min?: string;
  max?: string;
  required?: boolean;
  name?: string;
  placeholder?: string;
  locale?: string;
  hint?: string;
  className?: string;
}

export function describeFieldValue(value: string, withTime: boolean, locale = "en"): string {
  const [date, time] = value.split("T");
  if (!isISODate(date)) return "";
  const day = dayLabel(date, { locale });
  const dayText = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
  if (withTime && isWallTime(time)) return `${dayText} · ${formatTime(time, locale)}`;
  return dayText || day.short;
}

export function DateField({
  label,
  value,
  onChange,
  withTime = false,
  min,
  max,
  required,
  name,
  placeholder,
  locale = "en",
  hint,
  className,
}: DateFieldProps) {
  const id = useId();
  const shown = value ? describeFieldValue(value, withTime, locale) : "";
  return (
    <div className={["wk-field", className].filter(Boolean).join(" ")}>
      <label className="wk-label" htmlFor={id}>
        {label}
      </label>
      <div className="wk-field-box" data-empty={shown ? undefined : true}>
        <span className="wk-field-text" aria-hidden="true">
          {shown || placeholder || (withTime ? "Pick a day and time" : "Pick a day")}
        </span>
        <svg className="wk-field-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect
            x="3.5"
            y="5"
            width="17"
            height="15"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M3.5 9.5h17M8 3v4M16 3v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <input
          id={id}
          className="wk-field-input"
          type={withTime ? "datetime-local" : "date"}
          value={value}
          min={min}
          max={max}
          required={required}
          name={name}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {
              // Not allowed (e.g. cross-origin iframe): native focus still works.
            }
          }}
        />
      </div>
      {hint && (
        <p className="wk-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
