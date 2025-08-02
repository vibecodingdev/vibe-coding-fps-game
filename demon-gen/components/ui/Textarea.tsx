import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gaming-text-primary mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            "gaming-input w-full resize-none",
            error && "border-gaming-danger",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-gaming-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
