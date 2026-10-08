"use client";

/**
 * A row of tappable choices that is a real radio group: arrow keys move
 * between chips, one is selected, a screen reader hears "3 of 6". Every chip
 * is a 44px target. Used for times, lengths and modes — anything that would
 * otherwise be a select or a typed value.
 */
import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface ChipOption<V extends string | number> {
  value: V;
  label: ReactNode;
  /** Extra words for assistive tech when the label is terse. */
  ariaLabel?: string;
  disabled?: boolean;
}

export interface ChipGroupProps<V extends string | number> {
  label: string;
  /** Visually hide the label (it is still announced). */
  hideLabel?: boolean;
  options: ChipOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  className?: string;
}

export function ChipGroup<V extends string | number>({
  label,
  hideLabel,
  options,
  value,
  onChange,
  className,
}: ChipGroupProps<V>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.value === value);
  // Roving tab stop: the selected chip, else the first enabled one.
  const tabStop =
    selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : enabled[0];

  const move = (from: number, delta: number) => {
    const pos = enabled.indexOf(from);
    const next = enabled[(pos + delta + enabled.length) % enabled.length];
    if (next === undefined) return;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index, -1);
    }
  };

  return (
    <div className={["wk-group", className].filter(Boolean).join(" ")}>
      <span className={hideLabel ? "wk-sr-only" : "wk-label"}>{label}</span>
      <div className="wk-chips" role="radiogroup" aria-label={label}>
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <button
              key={String(option.value)}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.ariaLabel}
              disabled={option.disabled}
              tabIndex={index === tabStop ? 0 : -1}
              className="wk-chip"
              data-selected={selected || undefined}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => onKeyDown(e, index)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
