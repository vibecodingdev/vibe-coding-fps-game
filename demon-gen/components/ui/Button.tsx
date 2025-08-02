import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded font-gaming font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:ring-offset-2 focus:ring-offset-gaming-bg-primary disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide hover:-translate-y-0.5";

    const variants = {
      primary:
        "bg-gaming-primary text-white hover:bg-gaming-primary/90 hover:shadow-gaming-glow border-2 border-gaming-secondary",
      secondary:
        "bg-gaming-bg-secondary text-gaming-text-primary border-2 border-gaming-border hover:border-gaming-primary hover:shadow-gaming-glow",
      outline:
        "border-2 border-gaming-border text-gaming-text-muted hover:border-gaming-primary hover:text-gaming-primary hover:shadow-gaming-glow bg-transparent",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={clsx(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              fill="currentColor"
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
