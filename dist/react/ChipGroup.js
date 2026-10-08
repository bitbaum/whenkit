"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * A row of tappable choices that is a real radio group: arrow keys move
 * between chips, one is selected, a screen reader hears "3 of 6". Every chip
 * is a 44px target. Used for times, lengths and modes — anything that would
 * otherwise be a select or a typed value.
 */
import { useRef } from "react";
export function ChipGroup({ label, hideLabel, options, value, onChange, className, }) {
    const refs = useRef([]);
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const selectedIndex = options.findIndex((o) => o.value === value);
    // Roving tab stop: the selected chip, else the first enabled one.
    const tabStop = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : enabled[0];
    const move = (from, delta) => {
        const pos = enabled.indexOf(from);
        const next = enabled[(pos + delta + enabled.length) % enabled.length];
        if (next === undefined)
            return;
        onChange(options[next].value);
        refs.current[next]?.focus();
    };
    const onKeyDown = (event, index) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            move(index, 1);
        }
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            move(index, -1);
        }
    };
    return (_jsxs("div", { className: ["wk-group", className].filter(Boolean).join(" "), children: [_jsx("span", { className: hideLabel ? "wk-sr-only" : "wk-label", children: label }), _jsx("div", { className: "wk-chips", role: "radiogroup", "aria-label": label, children: options.map((option, index) => {
                    const selected = option.value === value;
                    return (_jsx("button", { ref: (el) => {
                            refs.current[index] = el;
                        }, type: "button", role: "radio", "aria-checked": selected, "aria-label": option.ariaLabel, disabled: option.disabled, tabIndex: index === tabStop ? 0 : -1, className: "wk-chip", "data-selected": selected || undefined, onClick: () => onChange(option.value), onKeyDown: (e) => onKeyDown(e, index), children: option.label }, String(option.value)));
                }) })] }));
}
//# sourceMappingURL=ChipGroup.js.map