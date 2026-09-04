import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import Input from "../common/Input";
import Button from "../common/Button";

const PasswordLoginForm = ({ onSubmit, onForgotPassword, loading }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Enter your username/phone and password");
      return;
    }
    setError("");
    onSubmit({ identifier: identifier.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ash mb-1.5">
          Welcome back
        </h2>
        <p className="text-sm text-ash-muted">Log in with your username or phone number.</p>
      </div>

      <Input
        label="Username or phone number"
        placeholder="username or Mobile no."
        inputClassName="font-mono"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoFocus
      />

      <div className="flex flex-col gap-1">
        <Input
          label="Password"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-signal-sky hover:underline"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        Log in <FiArrowRight />
      </Button>
    </form>
  );
};

export default PasswordLoginForm;