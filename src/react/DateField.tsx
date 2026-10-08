"use client";

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

/** Kept for callers of 0.1–0.2: the words for a value, or "" if invalid. */
export const describeFieldValue = describeValue;

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
  locale,
  hint,
  className,
}: DateFieldProps) {
  const id = useId();
  return (
    <div className={["wk-field", className].filter(Boolean).join(" ")}>
      <label className="wk-label" htmlFor={id}>
        {label}
      </label>
      <DateInput
        id={id}
        type={withTime ? "datetime-local" : "date"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        name={name}
        placeholder={placeholder}
        locale={locale}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && (
        <p className="wk-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
