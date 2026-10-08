"use client";

/**
 * A booking request in taps, shaped by what is being booked.
 *
 *  unit "day"  — pick a day, or tap a second day for a range. No times.
 *  unit "hour" — pick a day, then a start time inside opening hours, then a
 *                length. The end time is never typed.
 *  flexible    — optionally a preferred day; the provider proposes the slot.
 *
 * Controlled: the parent owns the `BookingChoice` and turns it into instants
 * with `resolveRequest` when sending. The one summary line under the picker
 * is exactly what the provider will read.
 */
import type { ReactNode } from "react";
import { nowIn, todayIn, weekday, type ISODate, type WallTime } from "../calendar.js";
import { formatLength, formatTime } from "../labels.js";
import { describeRequest, type BookingChoice, type RequestWords } from "../request.js";
import { DEFAULT_HOURS, lengthOptions, timeSlots, type DailyHours } from "../slots.js";
import { ChipGroup } from "./ChipGroup.js";
import { DayStrip } from "./DayStrip.js";

export interface BookingPickerWords extends RequestWords {
  day: string;
  days: string;
  time: string;
  length: string;
  mode: string;
  modeExact: string;
  modeDays: string;
  modeFlexible: string;
  preferredDay: string;
  flexibleHint: string;
  noTimes: string;
  otherDate: string;
}

export const DEFAULT_PICKER_WORDS: BookingPickerWords = {
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

export interface BookingRequestPickerProps {
  unit: "hour" | "day";
  /** IANA zone of the thing being booked, e.g. "Europe/Zurich". */
  zone: string;
  locale?: string;
  value: BookingChoice | null;
  onChange: (choice: BookingChoice) => void;
  /** Opening hours for hourly bookings. */
  hours?: DailyHours;
  /** Weekdays open, 0 = Sunday … 6 = Saturday. Omit for every day. */
  openWeekdays?: number[];
  /**
   * Lengths to offer, minutes. Defaults to what fits the opening hours. Pass
   * one value for a fixed duration (a 60-minute session): the length row is
   * not shown and that duration is used.
   */
  lengths?: number[];
  /** Spacing of start times, minutes. */
  stepMinutes?: number;
  /** Days shown as chips. */
  daysAhead?: number;
  allowFlexible?: boolean;
  words?: Partial<BookingPickerWords>;
  /** For tests and demos; defaults to now. */
  now?: Date;
}

function emptyFor(unit: "hour" | "day"): BookingChoice {
  return unit === "day"
    ? { kind: "days", from: null, to: null }
    : { kind: "slot", date: null, time: null, lengthMinutes: null };
}

export function BookingRequestPicker({
  unit,
  zone,
  locale = "en",
  value,
  onChange,
  hours = DEFAULT_HOURS,
  lengths: lengthsProp,
  openWeekdays,
  stepMinutes = 60,
  daysAhead = 14,
  allowFlexible = true,
  words: wordOverrides,
  now,
}: BookingRequestPickerProps) {
  const words = { ...DEFAULT_PICKER_WORDS, ...wordOverrides };
  const instant = now ?? new Date();
  const today = todayIn(zone, instant);
  const choice = value ?? emptyFor(unit);
  const flexible = choice.kind === "flexible";
  const closed = (d: ISODate) => (openWeekdays ? !openWeekdays.includes(weekday(d)) : false);

  const modeChips = allowFlexible ? (
    <ChipGroup<"exact" | "flexible">
      label={words.mode}
      hideLabel
      value={flexible ? "flexible" : "exact"}
      options={[
        { value: "exact", label: unit === "day" ? words.modeDays : words.modeExact },
        { value: "flexible", label: words.modeFlexible },
      ]}
      onChange={(m) =>
        onChange(m === "flexible" ? { kind: "flexible", date: null } : emptyFor(unit))
      }
    />
  ) : null;

  let body: ReactNode;
  if (choice.kind === "flexible") {
    body = (
      <>
        <DayStrip
          label={words.preferredDay}
          today={today}
          days={daysAhead}
          locale={locale}
          value={choice.date}
          allowClear
          isDisabled={closed}
          otherDateLabel={words.otherDate}
          onChange={({ date }) => onChange({ kind: "flexible", date })}
        />
        <p className="wk-hint">{words.flexibleHint}</p>
      </>
    );
  } else if (choice.kind === "days") {
    body = (
      <DayStrip
        label={words.days}
        today={today}
        days={daysAhead}
        locale={locale}
        mode="range"
        from={choice.from}
        to={choice.to}
        isDisabled={closed}
        otherDateLabel={words.otherDate}
        onChange={({ from, to }) => onChange({ kind: "days", from, to })}
      />
    );
  } else {
    const lengths =
      lengthsProp && lengthsProp.filter((m) => m > 0).length > 0
        ? lengthsProp.filter((m) => m > 0)
        : lengthOptions(hours);
    const length = choice.lengthMinutes ?? lengths[0];
    const slots = choice.date
      ? timeSlots({
          hours,
          stepMinutes,
          lengthMinutes: length,
          notBefore: choice.date === today ? nowIn(zone, instant) : null,
        })
      : [];
    body = (
      <>
        <DayStrip
          label={words.day}
          today={today}
          days={daysAhead}
          locale={locale}
          value={choice.date}
          isDisabled={closed}
          otherDateLabel={words.otherDate}
          onChange={({ date }) =>
            onChange({
              kind: "slot",
              date,
              time: null,
              lengthMinutes: choice.lengthMinutes ?? length,
            })
          }
        />
        {choice.date &&
          (slots.length > 0 ? (
            <ChipGroup<WallTime>
              label={words.time}
              value={choice.time}
              options={slots.map((t) => ({ value: t, label: formatTime(t, locale) }))}
              onChange={(time) => onChange({ ...choice, time, lengthMinutes: length })}
            />
          ) : (
            <p className="wk-hint" role="status">
              {words.noTimes}
            </p>
          ))}
        {choice.date && slots.length > 0 && lengths.length > 1 && (
          <ChipGroup<number>
            label={words.length}
            value={length}
            options={lengths.map((m) => ({ value: m, label: formatLength(m, locale) }))}
            onChange={(lengthMinutes) => {
              // A longer booking may no longer fit after the chosen start.
              const fits = timeSlots({
                hours,
                stepMinutes,
                lengthMinutes,
                notBefore: choice.date === today ? nowIn(zone, instant) : null,
              });
              const time = choice.time && fits.includes(choice.time) ? choice.time : null;
              onChange({ ...choice, time, lengthMinutes });
            }}
          />
        )}
      </>
    );
  }

  const summary = describeRequest(choice, { locale, today, words });
  return (
    <div className="wk-picker">
      {modeChips}
      {body}
      <p className="wk-summary" aria-live="polite" data-empty={summary ? undefined : true}>
        {summary}
      </p>
    </div>
  );
}
