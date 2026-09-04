import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  const [isDecoyLocked, setIsDecoyLocked] = useState(false);

  useEffect(() => {
    if (user?.lockPin && user?.isDecoyModeActive) {
      const isUnlocked = sessionStorage.getItem("kafchat_decoy_unlocked") === "true";
      setIsDecoyLocked(!isUnlocked);
    } else {
      setIsDecoyLocked(false);
    }
  }, [user]);

  // Loading state par loader display karein taaki premature redirect na ho
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0e14]">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Token ya User missing hone par Login page redirect
  if (!token && !user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;