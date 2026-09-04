import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import { authService } from "../services/authService";
import { connectSocket, disconnectSocket } from "../services/socket";
import { getOrGenerateKeyPair } from "../crypto/e2eeEngine";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("kafchat_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("kafchat_token") || localStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(true);
  const [e2eeKeys, setE2eeKeys] = useState(null);

  useEffect(() => {
    const initCrypto = async () => {
      try {
        const keys = await getOrGenerateKeyPair();
        setE2eeKeys(keys);
      } catch (err) {
        console.error("Crypto init error:", err);
      }
    };
    initCrypto();
  }, []);

  useEffect(() => {
    if (token && user) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
  }, [token, user]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const activeToken = localStorage.getItem("kafchat_token") || localStorage.getItem("token");

      if (!activeToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data } = await authService.getMe();
        if (isMounted && data?.user) {
          setUser(data.user);
          localStorage.setItem("kafchat_user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn("Session verification check:", err?.response?.data?.message || err.message);
        if (err.response?.status === 401 && isMounted) {
          localStorage.removeItem("kafchat_token");
          localStorage.removeItem("token");
          localStorage.removeItem("kafchat_user");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const completeAuth = useCallback((authResponse) => {
    const activeToken = authResponse.token;
    const userData = authResponse.user;

    localStorage.setItem("kafchat_token", activeToken);
    localStorage.setItem("token", activeToken);
    localStorage.setItem("kafchat_user", JSON.stringify(userData));

    if (authResponse.sessionId) {
      localStorage.setItem("kafchat_session_id", authResponse.sessionId);
    }

    setToken(activeToken);
    setUser(userData);
    setLoading(false);
  }, []);

  const loginWithGoogle = useCallback(
    async (credentialToken) => {
      const deviceId = localStorage.getItem("kafchat_device_id") || "root_device_" + Date.now();
      localStorage.setItem("kafchat_device_id", deviceId);

      const res = await api.post("/auth/google", {
        token: credentialToken,
        deviceId,
      });

      if (res.data?.success) {
        completeAuth(res.data);
        toast.success(`Welcome back, ${res.data.user?.fullName?.split(" ")[0] || "User"}! 🎉`);
        return res.data;
      } else {
        throw new Error(res.data?.message || "Google auth failed");
      }
    },
    [completeAuth]
  );

  const checkUsername = useCallback(async (username) => {
    const res = await api.post("/auth/check-username", { username });
    return res.data;
  }, []);

  const loginWithPassword = useCallback(
    async ({ identifier, password, deviceId }) => {
      const { data } = await authService.loginWithPassword({ identifier, password, deviceId });
      if (data?.token) {
        completeAuth(data);
        toast.success(`Welcome back, ${data.user?.fullName?.split(" ")[0] || "User"}! 👋`);
      }
      return data;
    },
    [completeAuth]
  );

  const register = useCallback(
    async ({ phoneNumber, email, fullName, username, password, avatar, gender, dob }) => {
      const keys = e2eeKeys || (await getOrGenerateKeyPair());
      const rootDeviceId = localStorage.getItem("kafchat_device_id") || "root_device_" + Date.now();
      localStorage.setItem("kafchat_device_id", rootDeviceId);

      const res = await api.post("/auth/register", {
        phoneNumber,
        email,
        fullName,
        username,
        password,
        dob,
        publicKey: keys?.publicKeyBase64 || "",
        rootDeviceId,
        avatar,
        gender,
      });

      if (res.data?.success) {
        completeAuth(res.data);
        toast.success(`Welcome to KafChat, ${res.data.user?.fullName?.split(" ")[0] || "User"}! 🎉`);
        return res.data;
      }
      return res.data;
    },
    [completeAuth, e2eeKeys]
  );

  const sendOtp = useCallback(async (phoneNumber) => {
    const { data } = await authService.sendOtp(phoneNumber);
    return data;
  }, []);

  const verifyOtp = useCallback(
    async ({ phoneNumber, otp }) => {
      const { data } = await authService.verifyOtp({ phoneNumber, otp });
      if (data.token && data.user) {
        completeAuth(data);
      }
      return data;
    },
    [completeAuth]
  );

  const uploadProfilePhoto = useCallback(async (photoUrl) => {
    const { data } = await authService.uploadProfilePhoto(photoUrl);
    setUser((prev) => {
      const updated = { ...prev, profilePhotos: data.profilePhotos, avatar: data.avatar };
      localStorage.setItem("kafchat_user", JSON.stringify(updated));
      return updated;
    });
    return data;
  }, []);

  const deleteProfilePhoto = useCallback(async (photoId) => {
    const { data } = await authService.deleteProfilePhoto(photoId);
    setUser((prev) => {
      const updated = {
        ...prev,
        profilePhotos: data.profilePhotos,
        avatar: data.avatar || data.fallback,
      };
      localStorage.setItem("kafchat_user", JSON.stringify(updated));
      return updated;
    });
    return data;
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const { data } = await authService.updateProfile(updates);
    setUser((prev) => {
      const updated = { ...prev, ...data.user };
      localStorage.setItem("kafchat_user", JSON.stringify(updated));
      return updated;
    });
    return data.user;
  }, []);

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    const { data } = await authService.changePassword({ currentPassword, newPassword });
    return data;
  }, []);

  // Set & Synchronously update user state and storage
  const setChatLockPin = useCallback(async (pin) => {
    const cleanPin = pin.toString().trim();
    const { data } = await authService.setChatLockPin(cleanPin);
    if (data?.success) {
      setUser((prev) => {
        const updated = { ...(data.user || prev), lockPin: cleanPin };
        localStorage.setItem("kafchat_user", JSON.stringify(updated));
        return updated;
      });
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout().catch(() => {});
    } finally {
      localStorage.removeItem("kafchat_token");
      localStorage.removeItem("token");
      localStorage.removeItem("kafchat_user");
      localStorage.removeItem("kafchat_session_id");
      sessionStorage.removeItem("kafchat_decoy_unlocked");
      setToken(null);
      setUser(null);
      toast.success("Logged out successfully");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      e2eeKeys,
      isAuthenticated: Boolean(token && user),
      checkUsername,
      sendOtp,
      verifyOtp,
      loginWithPassword,
      loginWithGoogle,
      register,
      logout,
      uploadProfilePhoto,
      deleteProfilePhoto,
      updateProfile,
      changePassword,
      setChatLockPin,
      setUser,
    }),
    [
      user,
      token,
      loading,
      e2eeKeys,
      checkUsername,
      sendOtp,
      verifyOtp,
      loginWithPassword,
      loginWithGoogle,
      register,
      logout,
      uploadProfilePhoto,
      deleteProfilePhoto,
      updateProfile,
      changePassword,
      setChatLockPin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};