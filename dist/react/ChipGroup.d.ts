/**
 * A row of tappable choices that is a real radio group: arrow keys move
 * between chips, one is selected, a screen reader hears "3 of 6". Every chip
 * is a 44px target. Used for times, lengths and modes — anything that would
 * otherwise be a select or a typed value.
 */
import { type ReactNode } from "react";
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
export declare function ChipGroup<V extends string | number>({ label, hideLabel, options, value, onChange, className, }: ChipGroupProps<V>): import("react").JSX.Element;
//# sourceMappingURL=ChipGroup.d.ts.map