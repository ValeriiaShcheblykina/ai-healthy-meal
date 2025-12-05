import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  side = 'right',
}: SheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  const sideClasses = {
    right: 'right-0 top-0 h-full w-full sm:w-[400px]',
    left: 'left-0 top-0 h-full w-full sm:w-[400px]',
    top: 'top-0 left-0 w-full h-auto max-h-[90vh]',
    bottom: 'bottom-0 left-0 w-full h-auto max-h-[90vh]',
  };

  const translateClasses = {
    right: open ? 'translate-x-0' : 'translate-x-full',
    left: open ? 'translate-x-0' : '-translate-x-full',
    top: open ? 'translate-y-0' : '-translate-y-full',
    bottom: open ? 'translate-y-0' : 'translate-y-full',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={() => onOpenChange(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onOpenChange(false);
        }}
        role="button"
        tabIndex={0}
        aria-label="Close sheet"
      />
      {/* Content */}
      <div
        className={`fixed ${sideClasses[side]} z-50 transition-transform duration-300 ease-in-out ${translateClasses[side]}`}
      >
        {children}
      </div>
    </div>
  );
}

export function SheetContent({ children, className = '' }: SheetContentProps) {
  return (
    <div
      className={`bg-background flex h-full flex-col border-l shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ children, className = '' }: SheetHeaderProps) {
  return (
    <div className={`flex flex-col space-y-1.5 border-b p-6 ${className}`}>
      {children}
    </div>
  );
}

export function SheetFooter({ children, className = '' }: SheetFooterProps) {
  return (
    <div
      className={`flex flex-col-reverse border-t p-6 sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    >
      {children}
    </div>
  );
}

export function SheetTitle({ children, className = '' }: SheetTitleProps) {
  return (
    <h2
      className={`text-lg leading-none font-semibold tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
}

export function SheetDescription({
  children,
  className = '',
}: SheetDescriptionProps) {
  return (
    <p className={`text-muted-foreground text-sm ${className}`}>{children}</p>
  );
}

interface SheetCloseProps {
  onClose: () => void;
  className?: string;
}

export function SheetClose({ onClose, className = '' }: SheetCloseProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClose}
      className={`ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none ${className}`}
      aria-label="Close"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  );
}
