import { useState } from "react";
import { FiPhone, FiArrowRight } from "react-icons/fi";
import Input from "../common/Input";
import Button from "../common/Button";

const PhoneLoginForm = ({ onSubmit, loading }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const validate = () => /^\+?[1-9]\d{7,14}$/.test(phoneNumber);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setError("Enter a valid phone number with country code, e.g. +919876543210");
      return;
    }
    setError("");
    onSubmit(phoneNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ash mb-1.5">
          Enter your number
        </h2>
        <p className="text-sm text-ash-muted">
          We'll text you a 6-digit code. Standard rates may apply.
        </p>
      </div>

      <Input
        label="Phone number"
        type="tel"
        inputClassName="font-mono"
        placeholder="+91 98765 43210"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value.trim())}
        error={error}
        autoFocus
      />

      <Button type="submit" loading={loading} className="w-full">
        Send code <FiArrowRight />
      </Button>

      <p className="text-xs text-ash-faint text-center leading-relaxed">
        By continuing, you agree to Kafchat's Terms of Service and acknowledge
        our Privacy Policy.
      </p>
    </form>
  );
};

export default PhoneLoginForm;
