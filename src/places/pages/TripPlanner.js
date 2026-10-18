import React, { useState, useContext } from "react";
import { AuthContext } from "../../shared/context/auth-context";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import "./TripPlanner.css";

const VIBE_OPTIONS = [
  "Scenic, relaxed, local food, and cultural highlights",
  "Nature walks, peaceful lakes, and green sanctuaries",
  "Spiritual heritage, historic temples, and traditional bazaars",
  "Urban cafe hopping, modern viewpoints, and evening dining",
  "Family-friendly attractions, parks, and easy strolls",
];

const TripPlanner = () => {
  const auth = useContext(AuthContext);

  const [city, setCity] = useState("Pune");
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [vibe, setVibe] = useState(VIBE_OPTIONS[0]);
  const [customVibe, setCustomVibe] = useState("");
  const [onlyMyPlaces, setOnlyMyPlaces] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!city.trim()) {
      setError("Please enter a destination city.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const targetVibe = customVibe.trim() ? customVibe.trim() : vibe;

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (auth.token) {
        headers["Authorization"] = `Bearer ${auth.token}`;
      }

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/ai/plan-trip`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            city: city.trim(),
            days: Number(days),
            startDate: startDate || null,
            vibe: targetVibe,
            onlyMyPlaces: auth.isLoggedIn && onlyMyPlaces,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to generate itinerary.");
      }

      setPlan(data.plan);
    } catch (err) {
      setError(err.message || "Something went wrong while planning your trip.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadIcsFile = () => {
    if (!plan?.calendarData?.icsData) return;
    const blob = new Blob([plan.calendarData.icsData], {
      type: "text/calendar;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${city.toLowerCase()}-trip-itinerary.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="trip-planner">
      <div className="trip-planner__hero">
        <div className="trip-planner__badge">
          <span>✨</span> Smart Travel Assistant
        </div>
        <h1>Plan Your Next Adventure</h1>
        <p>
          Tell us your destination and desired vibe. We'll curate the best spots
          from the community, check the local weather, and map out your perfect daily itinerary.
        </p>
      </div>

      <div className="trip-planner__card">
        <form onSubmit={handlePlanSubmit} className="trip-planner__form">
          <div className="planner-field">
            <label htmlFor="city">Destination City</label>
            <input
              id="city"
              type="text"
              placeholder="e.g. Pune, Rome, Tokyo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="planner-field">
            <label htmlFor="days">Trip Duration</label>
            <select
              id="days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={1}>1 Day (Express Tour)</option>
              <option value={2}>2 Days (Weekend Trip)</option>
              <option value={3}>3 Days (Deep Exploration)</option>
            </select>
          </div>

          <div className="planner-field">
            <label htmlFor="startDate">
              Start Date <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "normal" }}>(Optional)</span>
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="planner-field planner-field--full">
            <label htmlFor="vibe">Select Trip Vibe</label>
            <select
              id="vibe"
              value={vibe}
              onChange={(e) => {
                setVibe(e.target.value);
                setCustomVibe("");
              }}
            >
              {VIBE_OPTIONS.map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="planner-field planner-field--full">
            <label htmlFor="customVibe">Or Describe Your Own Vibe / Wishlist (Optional)</label>
            <input
              id="customVibe"
              type="text"
              placeholder="e.g., Hidden viewpoints for sunset photography, budget cafes with outdoor seating"
              value={customVibe}
              onChange={(e) => setCustomVibe(e.target.value)}
            />
          </div>

          {auth.isLoggedIn && (
            <div className="planner-field planner-field--full">
              <label className="planner-toggle">
                <input
                  type="checkbox"
                  checked={onlyMyPlaces}
                  onChange={(e) => setOnlyMyPlaces(e.target.checked)}
                />
                <span>Only use places from my personal saved collection</span>
              </label>
            </div>
          )}

          {error && (
            <div style={{ gridColumn: "1 / -1", color: "#ef4444", fontWeight: "600" }}>
              ⚠️ {error}
            </div>
          )}

          <div className="trip-planner__actions">
            <button
              type="submit"
              className="trip-planner__submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="ai-spinner"></span> Curating Your Itinerary...
                </>
              ) : (
                <>✨ Generate Itinerary</>
              )}
            </button>
          </div>
        </form>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", margin: "4rem 0" }}>
          <LoadingSpinner />
          <p style={{ marginTop: "1rem", color: "var(--color-text-muted)" }}>
            Finding favorite local spots, checking weather conditions, and crafting your schedule...
          </p>
        </div>
      )}

      {plan && !isLoading && (
        <div className="trip-plan">
          <div className="trip-plan__header">
            <h2>{plan.tripTitle}</h2>
            <p className="trip-plan__summary">{plan.summary}</p>

            <div className="trip-plan__meta">
              <div className="trip-plan__weather">
                <span>🌤️</span>
                <span>
                  Live Weather: {plan.liveWeather?.currentTemperature} (Rain chance:{" "}
                  {plan.liveWeather?.forecastSummary?.rainChance || "Low"})
                </span>
              </div>

              {plan.calendarData?.icsData && (
                <button
                  type="button"
                  className="trip-plan__calendar-btn"
                  onClick={downloadIcsFile}
                  title="Download .ics calendar file"
                >
                  📅 Add to Google / Apple Calendar
                </button>
              )}
            </div>
          </div>

          {plan.days?.map((day) => (
            <div key={day.dayNumber} className="trip-day">
              <div className="trip-day__title">
                <span className="trip-day__badge">Day {day.dayNumber}</span>
                <h3 className="trip-day__theme">{day.theme}</h3>
              </div>

              <div className="timeline">
                {day.schedule?.map((item, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-item__dot"></div>
                    <div className="timeline-item__content">
                      <span className="timeline-item__time">{item.timeSlot}</span>
                      <h4 className="timeline-item__place">{item.placeTitle}</h4>
                      <div className="timeline-item__address">{item.address}</div>
                      <p className="timeline-item__activity">{item.activity}</p>
                      {item.travelTip && (
                        <div className="timeline-item__tip">
                          💡 <strong>Tip:</strong> {item.travelTip}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
