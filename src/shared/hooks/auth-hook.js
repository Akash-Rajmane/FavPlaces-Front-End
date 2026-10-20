import { useState, useCallback, useEffect } from "react";

let logoutTimer;

const useAuth = () => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const [image, setImage] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [tokenExpiration, setTokenExpiration] = useState(null);

  const setPremium = useCallback((premiumStatus) => {
    setIsPremium(Boolean(premiumStatus));
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.isPremium = Boolean(premiumStatus);
        localStorage.setItem("userData", JSON.stringify(parsed));
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }, []);

  const login = useCallback((uid, authToken, profileData = {}, expirationDate) => {
    setToken(authToken);
    const tokenExpirationDate =
      expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60);

    setTokenExpiration(tokenExpirationDate);
    setUserId(uid);
    setName(profileData.name || null);
    setEmail(profileData.email || null);
    setImage(profileData.image || null);
    setIsPremium(Boolean(profileData.isPremium));

    localStorage.setItem(
      "userData",
      JSON.stringify({
        userId: uid,
        token: authToken,
        name: profileData.name || null,
        email: profileData.email || null,
        image: profileData.image || null,
        isPremium: Boolean(profileData.isPremium),
        expiration: tokenExpirationDate.toISOString(),
      }),
    );
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserId(null);
    setName(null);
    setEmail(null);
    setImage(null);
    setIsPremium(false);
    setTokenExpiration(null);
    localStorage.removeItem("userData");
  }, []);

  useEffect(() => {
    if (token && tokenExpiration) {
      const remainingTime = tokenExpiration.getTime() - new Date().getTime();
      logoutTimer = setTimeout(logout, remainingTime);
    } else {
      clearTimeout(logoutTimer);
    }
  }, [token, logout, tokenExpiration]);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("userData"));
    if (
      storedData &&
      storedData.token &&
      new Date(storedData.expiration) > new Date()
    ) {
      login(
        storedData.userId,
        storedData.token,
        {
          name: storedData.name,
          email: storedData.email,
          image: storedData.image,
          isPremium: Boolean(storedData.isPremium),
        },
        new Date(storedData.expiration),
      );
    }
  }, [login]);

  // Sync premium status with backend if logged in
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchPaymentStatus = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api";
        const response = await fetch(`${backendUrl}/payment/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (isMounted && typeof data.isPremium === "boolean") {
            setPremium(data.isPremium);
          }
        }
      } catch (err) {
        // silent fail on network glitch
      }
    };

    fetchPaymentStatus();

    return () => {
      isMounted = false;
    };
  }, [token, setPremium]);

  return { token, login, logout, userId, name, email, image, isPremium, setPremium };
};

export default useAuth;
