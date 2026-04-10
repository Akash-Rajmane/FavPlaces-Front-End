import { useState, useCallback, useEffect } from "react";

let logoutTimer;

const useAuth = () => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const [image, setImage] = useState(null);
  const [tokenExpiration, setTokenExpiration] = useState(null);

  const login = useCallback((uid, authToken, profileData = {}, expirationDate) => {
    setToken(authToken);
    const tokenExpirationDate =
      expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60);

    setTokenExpiration(tokenExpirationDate);
    setUserId(uid);
    setName(profileData.name || null);
    setEmail(profileData.email || null);
    setImage(profileData.image || null);

    localStorage.setItem(
      "userData",
      JSON.stringify({
        userId: uid,
        token: authToken,
        name: profileData.name || null,
        email: profileData.email || null,
        image: profileData.image || null,
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
        },
        new Date(storedData.expiration),
      );
    }
  }, [login]);

  return { token, login, logout, userId, name, email, image };
};

export default useAuth;
