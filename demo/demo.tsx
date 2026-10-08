// Visual + browser check page. Not shipped.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BookingRequestPicker, DateField } from "../src/react/index.js";
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
