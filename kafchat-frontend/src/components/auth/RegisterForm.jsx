import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import Input from "../common/Input";
import Button from "../common/Button";

const RegisterForm = ({ onSubmit, loading }) => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (fullName.trim().length < 2) next.fullName = "Enter your full name";
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      next.username = "3-30 chars: lowercase letters, numbers, . or _";
    }
    if (password.length < 6) next.password = "At least 6 characters";
    if (password !== confirmPassword) next.confirmPassword = "Passwords don't match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit({ fullName: fullName.trim(), username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ash mb-1.5">
          You're almost in
        </h2>
        <p className="text-sm text-ash-muted">
          Set up your profile and a password so you can log back in anytime.
        </p>
      </div>

      <Input
        label="Full name"
        placeholder="Enter your name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        autoFocus
      />

      <Input
        label="Username"
        placeholder="username"
        inputClassName="font-mono lowercase"
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
        error={errors.username}
      />

      <Input
        label="Password"
        type="password"
        placeholder="At least 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      <Input
        label="Confirm password"
        type="password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />

      <Button type="submit" loading={loading} className="w-full">
        Create account <FiArrowRight />
      </Button>
    </form>
  );
};

export default RegisterForm;
