import { useEffect, useState } from "react";

const useLoadScript = (url) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const existingScript = document.getElementById("google-maps-script");

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = url;
      script.id = "google-maps-script";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setLoaded(true);
      };

      document.head.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, [url]);

  return loaded;
};

export default useLoadScript;
