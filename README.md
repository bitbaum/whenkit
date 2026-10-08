# @bitbaum/whenkit

Dates and times people can pick **without typing**: day chips, time chips,
length chips, a readable date field over the native picker, and a booking
request that resolves to `{ startsAt, endsAt }` in the provider's time zone.

```bash
pnpm add github:bitbaum/whenkit#v0.2.1
```

```tsx
import { BookingRequestPicker } from "@bitbaum/whenkit/react";
import { resolveRequest, todayIn, type BookingChoice } from "@bitbaum/whenkit";
import "@bitbaum/whenkit/styles.css";

const [choice, setChoice] = useState<BookingChoice | null>(null);

<BookingRequestPicker
  unit="hour" // "day" for things rented by the day — never asks for a time
  zone="Europe/Zurich" // the zone of the thing being booked
  hours={{ start: "09:00", end: "18:00" }}
  openWeekdays={[1, 2, 3, 4, 5]}
  lengths={[60]} // optional: one value = fixed duration, no length row
  value={choice}
  onChange={setChoice}
/>;

// On send:
const slot = resolveRequest(choice, { zone: "Europe/Zurich", today: todayIn("Europe/Zurich") });
// → { startsAt, endsAt, flexible }  (null while incomplete)
```

## Why

The fleet had ~120 raw `<input type="date|time|datetime-local">` fields in 15
repos. Booking dialogs asked for a start AND an end date-time — two fields
showing the browser's locale placeholder (`tt.mm.jjjj, --:--`) — for a studio
rented by the day. Three decisions replace that:

1. **The listing decides the shape.** Rented by the day → pick days, no times.
   Hourly → pick a day, then a start time **inside opening hours**, then a
   length. **Nobody types an end time.** Flexible → at most a preferred day;
   the provider proposes the slot.
2. **Chips for the common case.** The next two weeks as tappable days ("Today",
   "Tomorrow", "Fri 10"), plus "Another date…" for anything further out.
3. **Keep the native picker, lose the ugly field.** On a phone the platform
   picker is the best there is. `DateField` keeps the real `<input>` (keyboard,
   autofill, a11y) transparent on top of a display that reads "Sat, 11 Oct ·
   14:00", and opens the picker on tap.

## Rules it enforces

- Dates are `YYYY-MM-DD`, times `HH:MM` — wall-clock strings. They become an
  instant in one place, `zonedToUtc`, in the provider's zone (DST gaps
  resolve forward). `new Date("2026-10-11")` drift cannot happen.
- "Today" is the provider's today (`todayIn(zone)`), and start times already
  past are not offered.
- Every chip and day is a 44px target; the date input is 16px (iOS zooms
  below that); the day strip scrolls inside itself, never the page.
- Chip rows are real radio groups (arrow keys, one tab stop); day buttons
  carry full spoken labels ("Tomorrow, Friday 9 October").
- Words come from `Intl` ("Morgen", "demain") — override the few sentences
  via `words`.

## API

**Core** (`@bitbaum/whenkit`, no React): `todayIn`, `nowIn`, `addDays`,
`daysBetween`, `nextDays`, `weekday`, `zonedToUtc`, `isISODate`, `isWallTime`,
`dayLabel`, `formatTime`, `formatLength`, `timeSlots`, `lengthOptions`,
`DEFAULT_HOURS`, `isComplete`, `resolveRequest`, `describeRequest`,
`type BookingChoice`.

**React** (`@bitbaum/whenkit/react`): `BookingRequestPicker`, `DayStrip`,
`ChipGroup`, `DateField`.

**Look** (`@bitbaum/whenkit/styles.css`): `--wk-*` variables default to
`@bitbaum/design-tokens`; set them once to match any other app.

## Develop

```bash
pnpm install
pnpm run verify   # format, lint, types, build, unit + render tests, browser checks
```

`dist/` is committed so a `github:` install needs no build step; CI fails if it
differs from what the source builds to. The browser check (`test/browser.mjs`)
drives Chromium at 1280px and 390px, light and dark, and taps a booking end to
end.

## npm

Not yet on npm — the first publish needs the account owner's passkey (see
`.github/workflows/publish.yml`). Until then install from a tag as above.
