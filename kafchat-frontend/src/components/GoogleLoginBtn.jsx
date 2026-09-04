import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";

const GoogleLoginBtn = ({ onLoginSuccess, onError }) => {
  const { loginWithGoogle } = useAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google popup");
      }

      await loginWithGoogle(credentialResponse.credential);

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      const msg = err.response?.data?.message || err.message || "Google authentication failed";
      toast.error(msg);
      if (onError) onError(msg);
    }
  };

  const handleFailure = () => {
    console.error("Google Popup Closed/Failed");
    toast.error("Google Sign-In was cancelled or failed");
    if (onError) onError("Popup cancelled");
  };

  return (
    <div className="flex justify-center w-full my-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleFailure}
        useOneTap={false}
        shape="pill"
        theme="filled_blue"
        size="large"
        text="continue_with"
      />
    </div>
  );
};

export default GoogleLoginBtn;