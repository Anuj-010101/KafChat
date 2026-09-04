const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-ash-muted">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-signal-sky-deep animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-signal-sky-deep animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-signal-sky-deep animate-bounce" />
      </span>
      <span>{typingUsers.join(", ")} typing…</span>
    </div>
  );
};

export default TypingIndicator;
