import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gaming-text-primary mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            "gaming-input w-full",
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

Input.displayName = "Input";

export default Input;
