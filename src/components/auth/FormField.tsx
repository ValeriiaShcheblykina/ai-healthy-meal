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
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          className="text-destructive text-sm"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
