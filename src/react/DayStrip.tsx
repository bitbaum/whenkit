"use client";

/**
 * The next two weeks as tappable day chips — "Today", "Tomorrow", "Fri 10" —
 * plus "Another date…" for anything further out (the native picker, via
 * DateField). Most bookings are for the next few days; a calendar grid makes
 * the common case three taps and a scroll.
 *
 * `range` mode selects from–to: the first tap sets the start, the second
 * (later) tap the end, a tap on or before the start starts over.
 */
import { addDays, daysBetween, nextDays, type ISODate } from "../calendar.js";
import { dayLabel } from "../labels.js";
import { DateField } from "./DateField.js";

export interface DayStripProps {
  label: string;
  today: ISODate;
  /** How many days to show as chips. */
  days?: number;
  locale?: string;
  /** Single day: `value`. Range: `from` / `to`. */
  mode?: "single" | "range";
  value?: ISODate | null;
  from?: ISODate | null;
  to?: ISODate | null;
  onChange: (next: { date: ISODate | null; from: ISODate | null; to: ISODate | null }) => void;
  /** Days that cannot be picked (closed, booked). */
  isDisabled?: (date: ISODate) => boolean;
  /** Allow deselecting the chosen day (used for "flexible, no preference"). */
  allowClear?: boolean;
  otherDateLabel?: string;
}

export function DayStrip({
  label,
  today,
  days = 14,
  locale = "en",
  mode = "single",
  value = null,
  from = null,
  to = null,
  onChange,
  isDisabled,
  allowClear = false,
  otherDateLabel = "Another date…",
}: DayStripProps) {
  const strip = nextDays(today, days);
  const last = strip[strip.length - 1];

  const isSelected = (d: ISODate) => {
    if (mode === "single") return d === value;
    if (!from) return false;
    if (!to) return d === from;
    return daysBetween(from, d) >= 0 && daysBetween(d, to) >= 0;
  };

  const pick = (d: ISODate) => {
    if (mode === "single") {
      const next = allowClear && d === value ? null : d;
      onChange({ date: next, from: null, to: null });
      return;
    }
    if (!from || to || daysBetween(from, d) <= 0) {
      onChange({ date: null, from: d, to: null });
    } else {
      onChange({ date: null, from, to: d });
    }
  };

  // A date picked beyond the strip is still shown, as its own chip.
  const picked = mode === "single" ? value : (to ?? from);
  const outside = picked && daysBetween(last, picked) > 0 ? picked : null;

  return (
    <div className="wk-group">
      <span className="wk-label">{label}</span>
      <div className="wk-strip" role="group" aria-label={label}>
        {[...strip, ...(outside ? [outside] : [])].map((d) => {
          const l = dayLabel(d, { locale, today });
          const disabled = isDisabled?.(d) ?? false;
          const selected = isSelected(d);
          return (
            <button
              key={d}
              type="button"
              className="wk-day"
              aria-pressed={selected}
              aria-label={l.relative ? `${l.relative}, ${l.long}` : l.long}
              data-selected={selected || undefined}
              data-edge={
                mode === "range" && from && to && (d === from || d === to) ? true : undefined
              }
              disabled={disabled}
              onClick={() => pick(d)}
            >
              <span className="wk-day-top">{l.relative ?? l.weekdayShort}</span>
              <span className="wk-day-num">{l.dayOfMonth}</span>
              <span className="wk-day-bottom">{l.monthShort}</span>
            </button>
          );
        })}
      </div>
      <DateField
        className="wk-other"
        label={otherDateLabel}
        value=""
        min={addDays(today, 0)}
        locale={locale}
        placeholder={otherDateLabel}
        onChange={(v) => {
          if (v && !(isDisabled?.(v) ?? false)) pick(v);
        }}
      />
    </div>
  );
}
