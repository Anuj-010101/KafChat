const VARIANTS = {
  primary:
    "bg-signal-sky text-ink font-semibold hover:bg-signal-sky/90 disabled:bg-signal-sky/40 disabled:cursor-not-allowed",
  secondary:
    "bg-ink-soft text-ash border border-ink-border hover:bg-ink-border disabled:opacity-40 disabled:cursor-not-allowed",
  ghost: "text-ash-muted hover:text-ash hover:bg-ink-soft",
  danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
};

const Button = ({
  children,
  variant = "primary",
  className = "",
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors duration-150 ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {loading && (
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    )}
    {children}
  </button>
);

export default Button;
