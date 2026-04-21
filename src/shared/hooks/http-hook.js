import { useState, useCallback, useRef, useEffect } from "react";

const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const activeHttpRequests = useRef([]);

  const sendRequest = useCallback(
    async (url, method = "GET", body = null, headers = {}) => {
      setError(null);
      setIsLoading(true);

      const httpAbortCtrl = new AbortController();
      activeHttpRequests.current.push(httpAbortCtrl);

      try {
        const finalUrl =
          method === "GET"
            ? `${url}${url.includes("?") ? "&" : "?"}ts=${Date.now()}`
            : url;

        const isFormData = body instanceof FormData;
        const defaultHeaders = {};
        if (body && !isFormData) {
          defaultHeaders["Content-Type"] = "application/json";
        }

        const response = await fetch(finalUrl, {
          method,
          body,
          headers: {
            ...defaultHeaders,
            ...headers,
          },
          signal: httpAbortCtrl.signal,
          cache: "no-store",
        });

        let responseData;
        try {
          responseData = await response.json();
        } catch {
          responseData = null;
        }

        activeHttpRequests.current = activeHttpRequests.current.filter(
          (reqCtrl) => reqCtrl !== httpAbortCtrl,
        );

        if (!response.ok) {
          throw new Error(responseData?.message || "Request failed.");
        }

        setIsLoading(false);
        return responseData;
      } catch (err) {
        if (err.name === "AbortError") {
          setIsLoading(false);
          return;
        }

        setError(err.message || "Something went wrong.");
        setIsLoading(false);
        throw err;
      }
    },
    [],
  );

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    return () => {
      activeHttpRequests.current.forEach((abortCtrl) => abortCtrl.abort());
    };
  }, []);

  return { isLoading, error, sendRequest, clearError };
};

export default useHttpClient;
