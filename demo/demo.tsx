// Visual + browser check page. Not shipped.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BookingRequestPicker, DateField, DateInput } from "../src/react/index.js";
import { resolveRequest, todayIn, type BookingChoice } from "../src/index.js";

const ZONE = "Europe/Zurich";

function Booking({ unit, id }: { unit: "hour" | "day"; id: string }) {
  const [choice, setChoice] = useState<BookingChoice | null>(null);
  const resolved = resolveRequest(choice, { zone: ZONE, today: todayIn(ZONE) });
  return (
    <div>
      <BookingRequestPicker
        unit={unit}
        zone={ZONE}
        locale="en-GB"
        value={choice}
        onChange={setChoice}
        hours={{ start: "09:00", end: "18:00" }}
      />
      <pre id={`${id}-resolved`} className="resolved">
        {resolved ? JSON.stringify(resolved) : ""}
      </pre>
    </div>
  );
}

function Field() {
  const [value, setValue] = useState("");
  return <DateField label="Deadline" value={value} onChange={setValue} locale="en-GB" />;
}

createRoot(document.getElementById("hourly")!).render(<Booking unit="hour" id="hourly" />);
createRoot(document.getElementById("daily")!).render(<Booking unit="day" id="daily" />);
createRoot(document.getElementById("field")!).render(<Field />);
createRoot(document.getElementById("dialog")!).render(
  <>
    <strong>Book a long studio name that goes on and on</strong>
    <Booking unit="day" id="dialog" />
    <button type="button" id="dialog-send">
      Send booking request
    </button>
  </>,
);

createRoot(document.getElementById("own-class")!).render(
  <DateInput className="app-input" defaultValue="2026-10-11" id="own" />,
);
createRoot(document.getElementById("match-date")!).render(
  <DateInput className="match-input" defaultValue="2026-10-11" id="match" />,
);
createRoot(document.getElementById("block-class")!).render(
  <DateInput className="block-input" defaultValue="2026-10-11" id="blocked" />,
);
createRoot(document.getElementById("compact-class")!).render(
  <DateInput className="compact-input" defaultValue="2026-10-11" id="compact" />,
);
createRoot(document.getElementById("util-class")!).render(
  <DateInput className="util-input" defaultValue="2026-10-11" id="util" />,
);
