import { useEffect, useRef, useState } from "react";
import { FiArrowRight, FiEdit2 } from "react-icons/fi";
import Button from "../common/Button";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "../../utils/constants";

const OtpVerifyForm = ({ email, onSubmit, onResend, onEditEmail, loading, devOtp }) => {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_SECONDS);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(pasted.split("").concat(Array(OTP_LENGTH).fill("")).slice(0, OTP_LENGTH));
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isComplete) onSubmit(otp);
  };

  const handleResend = () => {
    setSecondsLeft(OTP_RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(""));
    onResend();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ash mb-1.5">Verify email code</h2>
        <p className="text-sm text-ash-muted">
          Sent to <span className="font-mono text-ash">{email}</span>{" "}
          {onEditEmail && (
            <button
              type="button"
              onClick={onEditEmail}
              className="inline-flex items-center gap-1 text-signal-sky-deep hover:underline ml-1"
            >
              <FiEdit2 size={12} /> edit
            </button>
          )}
        </p>
        {devOtp && (
          <p className="mt-2 text-xs font-mono text-signal-sky bg-signal-sky/10 border border-signal-sky/20 rounded-lg px-3 py-1.5 inline-block">
            Dev mode — OTP: {devOtp}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-between" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg font-mono bg-ink-soft border border-ink-border rounded-xl text-ash focus:border-signal-sky outline-none transition-colors"
          />
        ))}
      </div>

      <Button type="submit" loading={loading} disabled={!isComplete} className="w-full">
        Verify <FiArrowRight />
      </Button>

      <div className="text-center text-xs text-ash-muted">
        {secondsLeft > 0 ? (
          <span>Resend code in {secondsLeft}s</span>
        ) : (
          <button type="button" onClick={handleResend} className="text-signal-sky-deep hover:underline">
            Resend code
          </button>
        )}
      </div>
    </form>
  );
};

export default OtpVerifyForm;