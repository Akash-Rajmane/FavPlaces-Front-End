import React, { useState } from "react";
import "./AIToolbar.css";

const AIDescriptionPolish = ({
  currentDescription,
  placeTitle,
  onApplyPolished,
  token,
}) => {
  const [tone, setTone] = useState("aesthetic");
  const [isPolishing, setIsPolishing] = useState(false);
  const [previousDescription, setPreviousDescription] = useState(null);
  const [error, setError] = useState(null);

  const polishHandler = async () => {
    if (!currentDescription || currentDescription.trim().length < 5) {
      setError("Please write at least a few words or notes first!");
      return;
    }

    setIsPolishing(true);
    setError(null);
    setPreviousDescription(currentDescription);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/ai/polish-description`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: currentDescription,
            title: placeTitle,
            tone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to polish description.");
      }

      if (data.polishedDescription) {
        onApplyPolished(data.polishedDescription);
      }
    } catch (err) {
      setError(err.message || "Something went wrong polishing description.");
    } finally {
      setIsPolishing(false);
    }
  };

  const undoHandler = () => {
    if (previousDescription) {
      onApplyPolished(previousDescription);
      setPreviousDescription(null);
    }
  };

  return (
    <div className="ai-toolbar">
      <div className="ai-toolbar__actions">
        <select
          className="ai-toolbar__select"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          disabled={isPolishing}
          title="Select description style"
        >
          <option value="aesthetic">Aesthetic & Poetic</option>
          <option value="practical">Practical & Informative</option>
          <option value="foodie">Foodie & Culinary</option>
          <option value="concise">Short & Punchy</option>
        </select>
        <button
          type="button"
          className="ai-btn"
          onClick={polishHandler}
          disabled={isPolishing}
        >
          {isPolishing ? (
            <>
              <span className="ai-spinner"></span> Polishing...
            </>
          ) : (
            <>✨ Enhance Text</>
          )}
        </button>
        {previousDescription && (
          <button
            type="button"
            className="ai-btn ai-btn--secondary"
            onClick={undoHandler}
            title="Restore previous description"
          >
            ↩ Undo
          </button>
        )}
      </div>
      {error && (
        <div style={{ width: "100%", color: "#ef4444", fontSize: "0.8rem", marginTop: "0.3rem" }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AIDescriptionPolish;
