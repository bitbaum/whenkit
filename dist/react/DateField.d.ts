export interface DateFieldProps {
    label: string;
    /** `YYYY-MM-DD` (date) or `YYYY-MM-DDTHH:MM` (withTime), or "" when empty. */
    value: string;
    onChange: (value: string) => void;
    withTime?: boolean;
    min?: string;
    max?: string;
    required?: boolean;
    name?: string;
    placeholder?: string;
    locale?: string;
    hint?: string;
    className?: string;
}
export declare function describeFieldValue(value: string, withTime: boolean, locale?: string): string;
export declare function DateField({ label, value, onChange, withTime, min, max, required, name, placeholder, locale, hint, className, }: DateFieldProps): import("react").JSX.Element;
//# sourceMappingURL=DateField.d.ts.map