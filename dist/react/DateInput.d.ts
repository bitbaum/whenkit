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
import { type ChangeEvent, type InputHTMLAttributes } from "react";
export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value" | "defaultValue"> {
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
export declare function emptyWords(locale: string, withTime: boolean): string;
/** "Sat, 11 Oct 2026" or "Sat, 11 Oct 2026 · 14:00"; "" when not a valid value. */
export declare function describeValue(value: string, withTime: boolean, locale?: string): string;
export declare const DateInput: import("react").ForwardRefExoticComponent<DateInputProps & import("react").RefAttributes<HTMLInputElement>>;
//# sourceMappingURL=DateInput.d.ts.map