import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../shared/context/auth-context";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import Modal from "../../shared/components/UIElements/Modal";
import Button from "../../shared/components/FormElements/Button";
import { useGoogleLogin } from "@react-oauth/google";
import "./TripPlanner.css";

const VIBE_OPTIONS = [
  "Scenic, relaxed, local food, and cultural highlights",
  "Nature walks, peaceful lakes, and green sanctuaries",
  "Spiritual heritage, historic temples, and traditional bazaars",
  "Urban cafe hopping, modern viewpoints, and evening dining",
  "Family-friendly attractions, parks, and easy strolls",
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const TripPlanner = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [city, setCity] = useState("Pune");
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [vibe, setVibe] = useState(VIBE_OPTIONS[0]);
  const [customVibe, setCustomVibe] = useState("");
  const [onlyMyPlaces, setOnlyMyPlaces] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // 'idle' | 'syncing' | 'success' | 'error'
  const [syncProgress, setSyncProgress] = useState("");
  const [calendarError, setCalendarError] = useState(null);
  const [syncedEventsCount, setSyncedEventsCount] = useState(0);

  // Razorpay Pro upgrade state
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);

  const handleUpgradeToPro = async () => {
    if (!auth.isLoggedIn) {
      navigate("/auth");
      return;
    }

    setIsUpgrading(true);
    setUpgradeError(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection."
        );
      }

      const orderRes = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/payment/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.message || "Failed to create payment order.");
      }

      if (orderData.alreadyPremium) {
        auth.setPremium(true);
        setIsUpgrading(false);
        return;
      }

      const options = {
        key:
          orderData.keyId ||
          process.env.REACT_APP_RZP_API_KEY ||
          "rzp_test_TqCLUZnwdUdqAU",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "FavPlaces Pro",
        description: "Autonomous AI Trip Planner (Lifetime Access)",
        image: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
        order_id: orderData.orderId,
        handler: async function (paymentResponse) {
          try {
            setIsUpgrading(true);
            const verifyRes = await fetch(
              `${process.env.REACT_APP_BACKEND_URL}/payment/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(
                verifyData.message || "Payment signature verification failed."
              );
            }

            auth.setPremium(true);
          } catch (vErr) {
            setUpgradeError(
              vErr.message || "Verification failed. Please contact support."
            );
          } finally {
            setIsUpgrading(false);
          }
        },
        prefill: {
          name: auth.name || orderData.userName || "",
          email: auth.email || orderData.userEmail || "",
        },
        theme: {
          color: "#d2691e",
        },
        modal: {
          ondismiss: function () {
            setIsUpgrading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (failResp) {
        setUpgradeError(
          failResp.error?.description || "Payment failed. Please try again."
        );
        setIsUpgrading(false);
      });
      razorpay.open();
    } catch (err) {
      setUpgradeError(err.message || "Failed to start payment.");
      setIsUpgrading(false);
    }
  };

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

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }

      if (!response.ok) {
        let msg = data.message || "Failed to generate itinerary. Please try again.";
        if (typeof msg === "string" && (msg.includes('{"error"') || msg.startsWith("{"))) {
          try {
            const parsed = JSON.parse(msg);
            if (
              parsed.error?.code === 503 ||
              parsed.error?.message?.includes("high demand") ||
              parsed.error?.status === "UNAVAILABLE"
            ) {
              msg = "AI travel servers are currently experiencing high demand. Please click Retry below in a few moments.";
            } else if (parsed.error?.message) {
              msg = parsed.error.message;
            }
          } catch (_) {
            msg = "AI service is momentarily busy. Please try again shortly.";
          }
        }
        throw new Error(msg);
      }

      setPlan(data.plan);
    } catch (err) {
      let friendlyError = err.message || "Something went wrong while planning your trip.";
      if (friendlyError.includes("Failed to fetch") || friendlyError.includes("NetworkError")) {
        friendlyError = "Server connection timed out or is temporarily unreachable. Please wait a few seconds and click Retry.";
      }
      setError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const parseTimeSlotToISO = (datePrefix, timeSlot) => {
    if (!timeSlot || typeof timeSlot !== "string") {
      return {
        startISO: `${datePrefix}T09:00:00`,
        endISO: `${datePrefix}T10:30:00`,
      };
    }

    const match = timeSlot.match(
      /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i
    );

    const pad = (n) => String(n).padStart(2, "0");

    if (match) {
      let [, sH, sM, sP, eH, eM, eP] = match;
      sH = parseInt(sH, 10);
      sM = parseInt(sM, 10);
      eH = parseInt(eH, 10);
      eM = parseInt(eM, 10);

      if (sP && sP.toUpperCase() === "PM" && sH < 12) sH += 12;
      if (sP && sP.toUpperCase() === "AM" && sH === 12) sH = 0;
      if (eP && eP.toUpperCase() === "PM" && eH < 12) eH += 12;
      if (eP && eP.toUpperCase() === "AM" && eH === 12) eH = 0;

      const offsetMinutes = -new Date().getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? "+" : "-";
      const absMin = Math.abs(offsetMinutes);
      const tzString = `${sign}${pad(Math.floor(absMin / 60))}:${pad(absMin % 60)}`;

      return {
        startISO: `${datePrefix}T${pad(sH)}:${pad(sM)}:00${tzString}`,
        endISO: `${datePrefix}T${pad(eH)}:${pad(eM)}:00${tzString}`,
      };
    }

    return {
      startISO: `${datePrefix}T10:00:00`,
      endISO: `${datePrefix}T12:00:00`,
    };
  };

  const syncAllStopsToGoogleCalendar = async (accessToken) => {
    const baseDate = startDate ? new Date(startDate) : new Date();
    const tripBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;

    let totalStops = 0;
    (plan.days || []).forEach((d) => {
      totalStops += (d.schedule || []).length;
    });

    let completed = 0;
    for (const day of plan.days || []) {
      const dayDate = new Date(tripBase);
      dayDate.setDate(tripBase.getDate() + (day.dayNumber - 1));
      const year = dayDate.getFullYear();
      const month = String(dayDate.getMonth() + 1).padStart(2, "0");
      const date = String(dayDate.getDate()).padStart(2, "0");
      const datePrefix = `${year}-${month}-${date}`;

      for (const item of day.schedule || []) {
        completed++;
        setSyncProgress(`Adding stop ${completed} of ${totalStops}: "${item.placeTitle}"...`);

        const { startISO, endISO } = parseTimeSlotToISO(datePrefix, item.timeSlot);

        const eventBody = {
          summary: `${item.placeTitle} - ${plan.tripTitle || `${city} Trip`}`,
          description: `${item.activity}\n\n💡 Travel Tip: ${item.travelTip || "Enjoy your visit!"}\n📍 Location: ${item.address}\n\nCurated with FavPlaces`,
          location: item.address || city,
          start: {
            dateTime: startISO,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: endISO,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventBody),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed to create event for ${item.placeTitle}`);
        }
      }
    }

    setSyncedEventsCount(completed);
  };

  const requestGoogleCalendarAuth = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar.events",
    hint: auth.email || undefined,
    onSuccess: async (tokenResponse) => {
      try {
        setSyncStatus("syncing");
        setCalendarError(null);
        await syncAllStopsToGoogleCalendar(tokenResponse.access_token);
        setSyncStatus("success");
      } catch (err) {
        console.error("Google Calendar sync error:", err);
        setCalendarError(err.message || "Failed to create events in Google Calendar.");
        setSyncStatus("error");
      }
    },
    onError: (err) => {
      console.error("Google auth error:", err);
      setCalendarError(
        "Google blocked or cancelled authorization. If your Google Cloud app is in 'Testing' mode, add your email to Test Users in Google Cloud Console. Alternatively, click 'Open in Google Calendar Web' below to add it instantly without any permissions."
      );
      setSyncStatus("error");
    },
  });

  const handleOpenGoogleCalendarWeb = () => {
    const baseDate = startDate ? new Date(startDate) : new Date();
    const tripBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const startStr = tripBase.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15) + "Z";
    const endDate = new Date(tripBase);
    endDate.setDate(tripBase.getDate() + Number(days));
    const endStr = endDate.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15) + "Z";

    const title = encodeURIComponent(plan.tripTitle || `Trip to ${city}`);
    const details = encodeURIComponent(
      `${plan.summary || ""}\n\nSchedule highlights:\n` +
        (plan.days || [])
          .map(
            (d) =>
              `Day ${d.dayNumber} (${d.theme}): ` +
              (d.schedule || []).map((s) => `${s.timeSlot} - ${s.placeTitle}`).join("; ")
          )
          .join("\n")
    );
    const location = encodeURIComponent(city);
    let gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
    if (auth.email) {
      gcalUrl += `&authuser=${encodeURIComponent(auth.email)}`;
    }

    window.open(gcalUrl, "_blank", "noopener,noreferrer");
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

  const shareItineraryOnWhatsApp = () => {
    if (!plan) return;

    let text = `✈️ *Trip Plan: ${plan.tripTitle || `${city} Adventure`}*\n`;
    if (plan.summary) {
      text += `_${plan.summary}_\n\n`;
    }
    if (plan.liveWeather?.currentTemperature) {
      text += `🌤️ *Live Weather:* ${plan.liveWeather.currentTemperature} (Rain risk: ${plan.liveWeather.forecastSummary?.rainChance || "Low"})\n\n`;
    }

    (plan.days || []).forEach((day) => {
      text += `📅 *Day ${day.dayNumber}: ${day.theme}*\n`;
      (day.schedule || []).forEach((item) => {
        text += `• *${item.timeSlot}* - *${item.placeTitle}*\n`;
        if (item.address) {
          text += `  📍 _${item.address}_\n`;
        }
        if (item.activity) {
          text += `  ℹ️ ${item.activity}\n`;
        }
        if (item.travelTip) {
          text += `  💡 _Tip: ${item.travelTip}_\n`;
        }
        text += `\n`;
      });
    });

    text += `🗺️ *Curated with FavPlaces*\n${window.location.origin}/planner`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const totalStopsCount = (plan?.days || []).reduce(
    (acc, day) => acc + (day.schedule?.length || 0),
    0
  );

  if (!auth.isLoggedIn || !auth.isPremium) {
    return (
      <div className="trip-planner">
        <div className="trip-planner__hero">
          <div className="trip-planner__badge">
            <span>💎</span> Pro Exclusive Feature
          </div>
          <h1>Autonomous AI Trip Planner</h1>
          <p>
            Experience next-generation travel with Gemini-powered daily itineraries,
            real-time weather forecasts, Google Calendar sync, and WhatsApp exports.
          </p>
        </div>

        <div className="trip-planner__paywall">
          <div className="trip-planner__paywall-card">
            <div className="trip-planner__paywall-icon">✈️</div>
            <div className="trip-planner__paywall-badge">
              <span>✦</span> FavPlaces Pro
            </div>
            <h2>Unlock AI Trip Planning</h2>
            <p className="paywall-subtitle">
              {auth.isLoggedIn
                ? `Welcome, ${auth.name || "Explorer"}! Upgrade your account to unlock autonomous day-by-day travel planning.`
                : "Sign in and upgrade to unlock autonomous day-by-day travel planning."}
            </p>

            <div className="trip-planner__paywall-grid">
              <div className="trip-planner__paywall-feature">
                <div className="trip-planner__paywall-feature-icon">✨</div>
                <div>
                  <div className="trip-planner__paywall-feature-title">AI Itinerary Generation</div>
                  <div className="trip-planner__paywall-feature-desc">
                    Personalized multi-day plans based on your travel vibe and saved favorite places.
                  </div>
                </div>
              </div>

              <div className="trip-planner__paywall-feature">
                <div className="trip-planner__paywall-feature-icon">🌦️</div>
                <div>
                  <div className="trip-planner__paywall-feature-title">Live Weather & Rain Warnings</div>
                  <div className="trip-planner__paywall-feature-desc">
                    Real-time temperature and precipitation forecasts via Open-Meteo.
                  </div>
                </div>
              </div>

              <div className="trip-planner__paywall-feature">
                <div className="trip-planner__paywall-feature-icon">📅</div>
                <div>
                  <div className="trip-planner__paywall-feature-title">1-Click Google Calendar Sync</div>
                  <div className="trip-planner__paywall-feature-desc">
                    Direct sync of all planned stops, schedules, and tips into your Google Calendar.
                  </div>
                </div>
              </div>

              <div className="trip-planner__paywall-feature">
                <div className="trip-planner__paywall-feature-icon">💬</div>
                <div>
                  <div className="trip-planner__paywall-feature-title">1-Click WhatsApp Export</div>
                  <div className="trip-planner__paywall-feature-desc">
                    Share complete formatted itineraries with friends and travel groups effortlessly.
                  </div>
                </div>
              </div>
            </div>

            <div className="trip-planner__paywall-pricing">
              <div className="paywall-pricing__price">
                <span className="paywall-pricing__amount">₹199</span>
                <span className="paywall-pricing__original">₹999</span>
                <span className="paywall-pricing__term">One-time / Lifetime</span>
              </div>
              <div className="paywall-pricing__tag">
                <span>🔥</span> 80% Off Launch Discount
              </div>
            </div>

            {upgradeError && (
              <div className="trip-planner__error" style={{ marginBottom: "1.5rem" }}>
                <span className="trip-planner__error-icon">⚠️</span>
                <span>{upgradeError}</span>
              </div>
            )}

            <div className="paywall-actions">
              {auth.isLoggedIn ? (
                <button
                  type="button"
                  className="paywall-upgrade-btn"
                  onClick={handleUpgradeToPro}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? (
                    <>
                      <LoadingSpinner asOverlay={false} /> Processing Payment...
                    </>
                  ) : (
                    <>
                      <span>💳</span> Upgrade to Pro with Razorpay (₹199)
                    </>
                  )}
                </button>
              ) : (
                <Link to="/auth" className="paywall-upgrade-btn">
                  <span>🔐</span> Sign In to Upgrade
                </Link>
              )}

              <div className="paywall-test-note">
                <span>🛡️</span>
                <span>
                  <strong>Razorpay Test Mode:</strong> Use test card details or mock UPI. No real money will be charged.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="trip-planner__pro-active-banner">
        <div className="trip-planner__pro-active-left">
          <span className="trip-planner__pro-active-badge">💎 PRO ACTIVE</span>
          <span className="trip-planner__pro-active-text">
            FavPlaces Pro Unlocked — Unlimited Gemini AI Itineraries, Calendar Sync & Live Weather Forecasts
          </span>
        </div>
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
            <div className="planner-error-banner">
              <div className="planner-error-banner__icon">💡</div>
              <div className="planner-error-banner__content">
                <strong>Notice</strong>
                <p>{error}</p>
              </div>
              <button
                type="button"
                className="planner-error-banner__retry"
                onClick={handlePlanSubmit}
                disabled={isLoading}
              >
                ↻ Retry
              </button>
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

              <div className="trip-plan__header-actions">
                {plan.calendarData?.icsData && (
                  <button
                    type="button"
                    className="trip-plan__calendar-btn"
                    onClick={() => {
                      setCalendarError(null);
                      setSyncStatus("idle");
                      setSyncProgress("");
                      setShowCalendarModal(true);
                    }}
                    title="Add to Calendar"
                  >
                    📅 Add to Calendar
                  </button>
                )}

                <button
                  type="button"
                  className="trip-plan__whatsapp-btn"
                  onClick={shareItineraryOnWhatsApp}
                  title="Share full itinerary via WhatsApp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.53 1.771.82 2.791.82 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.806-5.768-5.806zm3.385 8.213c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.122-.513-1.825-.757-3.003-2.616-3.094-2.738-.091-.121-.741-.986-.741-1.88 0-.895.469-1.336.636-1.516.167-.181.365-.226.487-.226.122 0 .243.002.349.006.111.005.26-.042.406.31.144.348.498 1.214.542 1.304.044.09.073.196.015.312-.058.115-.087.187-.174.289-.087.102-.184.228-.263.306-.089.088-.182.184-.078.362.104.179.463.764.994 1.237.685.61 1.263.799 1.442.888.179.089.284.076.39-.046.106-.122.456-.531.577-.713.121-.182.243-.152.406-.091.163.061 1.034.488 1.212.577.178.089.297.133.341.209.045.076.045.438-.099.843zm-3.385-12.385c-5.514 0-10 4.486-10 10 0 1.758.459 3.473 1.333 4.985l-1.417 5.176 5.297-1.389c1.464.798 3.117 1.228 4.787 1.228 5.514 0 10-4.486 10-10s-4.486-10-10-10zm0 18.281c-1.492 0-2.955-.394-4.231-1.141l-.304-.179-3.14.823.838-3.06-.197-.313c-.822-1.309-1.258-2.833-1.258-4.411 0-4.566 3.714-8.281 8.281-8.281 4.566 0 8.281 3.715 8.281 8.281 0 4.566-3.715 8.281-8.281 8.281z" />
                  </svg>
                  Share on WhatsApp
                </button>
              </div>
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

      <Modal
        show={showCalendarModal}
        onCancel={() => {
          if (syncStatus !== "syncing") {
            setShowCalendarModal(false);
          }
        }}
        header="Add to Calendar"
        footer={
          <Button
            inverse
            onClick={() => setShowCalendarModal(false)}
            disabled={syncStatus === "syncing"}
          >
            {syncStatus === "success" ? "Done" : "Cancel"}
          </Button>
        }
      >
        <div className="calendar-modal">
          {auth.isLoggedIn && auth.email ? (
            <div className="calendar-modal__account">
              <div className="calendar-modal__account-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4H19ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z"
                    fill="#1a73e8"
                  />
                </svg>
              </div>
              <div className="calendar-modal__account-details">
                <span className="calendar-modal__account-label">Signed in with Google</span>
                <span className="calendar-modal__account-email">{auth.email}</span>
              </div>
              <span className="calendar-modal__account-badge">Google Calendar</span>
            </div>
          ) : (
            <div className="calendar-modal__guest">
              <span className="calendar-modal__guest-icon">💡</span>
              <div>
                <h4>Not signed in</h4>
                <p>Sign in with your Google account to add this trip directly to your calendar.</p>
              </div>
            </div>
          )}

          {syncStatus === "syncing" && (
            <div className="calendar-modal__progress">
              <LoadingSpinner />
              <p className="calendar-modal__progress-text">{syncProgress}</p>
            </div>
          )}

          {syncStatus === "success" && (
            <div className="calendar-modal__success">
              <div className="calendar-modal__success-icon">✅</div>
              <h4>Trip Added to Calendar!</h4>
              <p>
                Successfully created <strong>{syncedEventsCount}</strong> events for{" "}
                <strong>{auth.email || "your calendar"}</strong>.
              </p>
              <div className="calendar-modal__success-actions">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-modal__open-btn"
                >
                  Open Google Calendar ↗
                </a>
              </div>
            </div>
          )}

          {syncStatus !== "syncing" && syncStatus !== "success" && (
            <>
              {auth.isLoggedIn && auth.email ? (
                <p className="calendar-modal__question">
                  Do you want to add this <strong>{plan?.tripTitle}</strong> itinerary ({totalStopsCount} stops) directly to your calendar for <strong>{auth.email}</strong>?
                </p>
              ) : (
                <p className="calendar-modal__question">
                  Add your <strong>{plan?.tripTitle}</strong> itinerary ({totalStopsCount} stops) directly to your calendar:
                </p>
              )}

              {calendarError && (
                <div className="calendar-modal__error">
                  <div>⚠️ {calendarError}</div>
                  {(calendarError.includes("has not been used") ||
                    calendarError.includes("calendar-json.googleapis.com")) && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <a
                        href="https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=384601241809"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          color: "#991b1b",
                          fontWeight: "700",
                          textDecoration: "underline",
                        }}
                      >
                        👉 Click here to Enable Google Calendar API ↗
                      </a>
                    </div>
                  )}
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#991b1b",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}
                      onClick={handleOpenGoogleCalendarWeb}
                    >
                      Or open pre-filled in Google Calendar Web ↗
                    </button>
                  </div>
                </div>
              )}

              <div className="calendar-modal__actions">
                <button
                  type="button"
                  className="calendar-modal__btn calendar-modal__btn--primary"
                  onClick={() => {
                    setCalendarError(null);
                    requestGoogleCalendarAuth();
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4H19ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z"
                      fill="white"
                    />
                  </svg>
                  Add to Calendar
                </button>

                <div style={{ textAlign: "center", marginTop: "0.4rem" }}>
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-text-muted)",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() => {
                      downloadIcsFile();
                      setShowCalendarModal(false);
                    }}
                  >
                    Or export as .ics file
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TripPlanner;
