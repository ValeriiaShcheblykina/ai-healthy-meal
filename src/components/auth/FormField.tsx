import { Label } from '@/components/ui/label';

export interface FormFieldProps {
  label: string;
  error?: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  htmlFor,
  required,
  children,
}: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="block">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="mt-2">{children}</div>
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="text-destructive mt-2 text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
