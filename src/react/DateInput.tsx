"use client";

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
import {
  forwardRef,
  useEffect,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type MouseEvent,
} from "react";
import { isISODate, isWallTime } from "../calendar.js";
import { formatTime } from "../labels.js";

export interface DateInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "value" | "defaultValue"
> {
  /** `date` (default) or `datetime-local`. */
  type?: "date" | "datetime-local";
  /** `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`. */
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Words shown while empty. Defaults to a short phrase in the page language. */
  placeholder?: string;
  /** BCP 47 tag. Defaults to the page's `<html lang>` (read after mount). */
  locale?: string;
  /** Applied to the visible box — give it the same classes as the app's inputs. */
  className?: string;
}

const EMPTY_WORDS: Record<string, [string, string]> = {
  en: ["Pick a date", "Pick a date and time"],
  de: ["Datum wählen", "Datum und Uhrzeit wählen"],
  fr: ["Choisir une date", "Choisir la date et l'heure"],
  it: ["Scegli una data", "Scegli data e ora"],
  es: ["Elegir fecha", "Elegir fecha y hora"],
};

export function emptyWords(locale: string, withTime: boolean): string {
  const words = EMPTY_WORDS[locale.toLowerCase().split("-")[0]] ?? EMPTY_WORDS.en;
  return words[withTime ? 1 : 0];
}

/** "Sat, 11 Oct 2026" or "Sat, 11 Oct 2026 · 14:00"; "" when not a valid value. */
export function describeValue(value: string, withTime: boolean, locale = "en"): string {
  const [date, time] = value.split("T");
  if (!isISODate(date)) return "";
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
function safeDescribe(value: string, withTime: boolean, locale: string): string {
  try {
    return describeValue(value, withTime, locale);
  } catch {
    return describeValue(value, withTime, "en");
  }
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  {
    type = "date",
    value,
    defaultValue,
    onChange,
    placeholder,
    locale,
    className,
    style,
    onClick,
    ...rest
  },
  ref,
) {
  const withTime = type === "datetime-local";
  const [inner, setInner] = useState(defaultValue ?? "");
  const [lang, setLang] = useState(locale ?? "en");
  useEffect(() => {
    if (locale) setLang(locale);
    else setLang(document.documentElement.lang || "en");
  }, [locale]);

  const current = value ?? inner;
  const text = current ? safeDescribe(current, withTime, lang) : "";
  const empty = !text;

  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // Not permitted here (e.g. a cross-origin frame): native focus still works.
    }
  };

  return (
    <span
      className={["wk-input", className].filter(Boolean).join(" ")}
      data-empty={empty || undefined}
      data-disabled={rest.disabled || undefined}
      data-invalid={rest["aria-invalid"] === true || rest["aria-invalid"] === "true" || undefined}
      style={style}
    >
      <span className="wk-input-text" aria-hidden="true">
        {text || placeholder || emptyWords(lang, withTime)}
      </span>
      <svg className="wk-input-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
        {...rest}
        ref={ref}
        type={type}
        className="wk-input-native"
        {...(value !== undefined ? { value } : { defaultValue })}
        onClick={handleClick}
        onChange={(event) => {
          setInner(event.target.value);
          onChange?.(event);
        }}
      />
    </span>
  );
});
