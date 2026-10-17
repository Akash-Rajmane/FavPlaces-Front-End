import React, { useState } from "react";
import "./AIToolbar.css";

const AIImageAutofill = ({ imageFile, token, onAutofillApplied }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  if (!imageFile) {
    return null;
  }

  const handleAutofill = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/ai/analyze-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Failed to analyze image with Gemini.");
      }

      if (resData.data) {
        onAutofillApplied(resData.data);
      }
    } catch (err) {
      setError(err.message || "Could not analyze image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="ai-autofill-banner">
      <div className="ai-autofill-banner__info">
        <h4>
          <span>✨</span> Auto-fill with Gemini Vision
        </h4>
        <p>Let AI detect the place, suggest a title, address, and write a description.</p>
        {error && <p style={{ color: "#f87171", marginTop: "0.25rem" }}>{error}</p>}
      </div>
      <button
        type="button"
        className="ai-btn"
        onClick={handleAutofill}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <span className="ai-spinner"></span> Analyzing...
          </>
        ) : (
          <>✨ Auto-Fill Fields</>
        )}
      </button>
    </div>
  );
};

export default AIImageAutofill;
