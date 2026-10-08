/**
 * How a day, a time and a length read to a person — in their language.
 *
 * Every string here comes from `Intl`, so "Today", "morgen" and "demain" are
 * the platform's words rather than a table this package would have to keep.
 * Days are formatted from their UTC anchor with `timeZone: "UTC"`, so the
 * label is always the day that was picked.
 */
import { dayAnchor, daysBetween, type ISODate, type WallTime, isWallTime } from "./calendar.js";

export interface DayLabel {
  date: ISODate;
  /** "Sat" */
  weekdayShort: string;
  /** "11" */
  dayOfMonth: string;
  /** "Oct" */
  monthShort: string;
  /** "Today" / "Tomorrow" (in the locale), otherwise null. */
  relative: string | null;
  /** "Saturday, 11 October" — for screen readers and summaries. */
  long: string;
  /** "Sat 11 Oct" */
  short: string;
}

function capitalise(text: string, locale: string): string {
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

export function dayLabel(date: ISODate, opts: { locale?: string; today?: ISODate } = {}): DayLabel {
  const locale = opts.locale ?? "en";
  const anchor = dayAnchor(date);
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...o }).format(anchor);
  let relative: string | null = null;
  if (opts.today) {
    const diff = daysBetween(opts.today, date);
    if (diff === 0 || diff === 1) {
      relative = capitalise(
        new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(diff, "day"),
        locale,
      );
    }
  }
  return {
    date,
    weekdayShort: f({ weekday: "short" }),
    dayOfMonth: f({ day: "numeric" }),
    monthShort: f({ month: "short" }),
    relative,
    long: f({ weekday: "long", day: "numeric", month: "long" }),
    short: f({ weekday: "short", day: "numeric", month: "short" }),
  };
}

/** "14:00" or "2:00 PM", whichever the locale uses. */
export function formatTime(time: WallTime, locale = "en"): string {
  if (!isWallTime(time)) return time;
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

/** "30 min", "2 hr", "1 day" — the locale's own short unit words. */
export function formatLength(minutes: number, locale = "en"): string {
  const unit = (value: number, u: "minute" | "hour" | "day") =>
    new Intl.NumberFormat(locale, { style: "unit", unit: u, unitDisplay: "short" }).format(value);
  if (minutes % (24 * 60) === 0) return unit(minutes / (24 * 60), "day");
  if (minutes % 60 === 0) return unit(minutes / 60, "hour");
  if (minutes > 60) return unit(Math.round((minutes / 60) * 10) / 10, "hour");
  return unit(minutes, "minute");
}
