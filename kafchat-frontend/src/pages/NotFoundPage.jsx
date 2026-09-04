import { Link } from "react-router-dom";
import Logo from "../components/common/Logo";
import Button from "../components/common/Button";

const NotFoundPage = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
    <Logo size={40} />
    <div>
      <h1 className="font-display text-3xl font-semibold text-ash mb-2">
        This chat doesn't exist
      </h1>
      <p className="text-ash-muted text-sm">
        The page you're looking for wandered off. Let's get you back.
      </p>
    </div>
    <Link to="/">
      <Button>Back to Kafchat</Button>
    </Link>
  </div>
);

export default NotFoundPage;
