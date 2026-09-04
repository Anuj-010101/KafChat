const Input = ({ label, error, className = "", inputClassName = "", ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && (
      <label className="text-xs font-medium text-ash-muted uppercase tracking-wide">
        {label}
      </label>
    )}
    <input
      className={`w-full bg-ink-soft border rounded-xl px-4 py-3 text-ash placeholder:text-ash-faint outline-none transition-colors ${
        error ? "border-danger" : "border-ink-border focus:border-signal-sky"
      } ${inputClassName}`}
      {...props}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
);

export default Input;
