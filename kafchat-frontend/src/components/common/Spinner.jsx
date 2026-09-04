import Logo from "./Logo";

const Spinner = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <Logo showWordmark={false} size={44} className="animate-flicker" />
      <div className="w-8 h-8 border-2 border-signal-sky border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-ink">{content}</div>
  );
};

export default Spinner;
