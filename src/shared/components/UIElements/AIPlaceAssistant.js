import React, { useState, useRef, useEffect } from "react";
import "./AIPlaceAssistant.css";

const QUICK_QUESTIONS = [
  "When is the best time of day to visit?",
  "What is this place famous for?",
  "What are signature dishes or drinks to try?",
  "Any photo or scenic viewpoint tips?",
  "Is parking or transit easy around here?",
];

const AIPlaceAssistant = ({ place, token }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: `Hello! I'm your FavPlaces Concierge for ${place?.title || "this destination"}. Ask me anything about tips, timings, vibes, or nearby recommendations!`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const sendQuestionHandler = async (questionToSend) => {
    const q = questionToSend || inputQuestion;
    if (!q || !q.trim() || isLoading) return;

    const userMessage = { role: "user", text: q.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputQuestion("");
    setIsLoading(true);

    try {
      // Pass previous chat history (excluding introductory message and the current question)
      const history = messages
        .slice(1)
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        }));

      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/ai/ask-place`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            place: {
              title: place?.title,
              address: place?.address,
              description: place?.description,
            },
            question: q.trim(),
            history,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to get an answer.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer || "I could not generate an answer right now.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `⚠️ ${err.message || "Could not reach assistant. Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat-drawer">
      <div
        className="ai-chat-drawer__header"
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
      >
        <div className="ai-chat-drawer__title">
          <span>✨</span>
          <div>
            <strong>Ask AI Concierge</strong>
            <div style={{ fontSize: "0.8rem", opacity: 0.85, fontWeight: "normal" }}>
              Instant tips, food recommendations, and local insights powered by Gemini
            </div>
          </div>
        </div>
        <div className="ai-chat-drawer__toggle-badge">
          {isOpen ? "Hide Assistant ▲" : "Chat with AI ▼"}
        </div>
      </div>

      {isOpen && (
        <div className="ai-chat-drawer__body">
          <div className="ai-chat-drawer__quick-prompts">
            {QUICK_QUESTIONS.map((qq, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-chip"
                onClick={() => sendQuestionHandler(qq)}
                disabled={isLoading}
              >
                {qq}
              </button>
            ))}
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-msg ai-msg--${msg.role}`}>
                <div className="ai-msg__sender">
                  {msg.role === "assistant" ? "✨ Concierge" : "You"}
                </div>
                <div className="ai-msg__bubble">{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-msg ai-msg--assistant">
                <div className="ai-msg__sender">✨ Concierge</div>
                <div className="ai-msg__bubble" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span className="ai-spinner" style={{ borderColor: "rgba(99, 102, 241, 0.3)", borderTopColor: "#6366f1" }}></span>
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="ai-chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestionHandler();
            }}
          >
            <input
              type="text"
              placeholder={`Ask anything about ${place?.title || "this place"}...`}
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="ai-chat-send-btn"
              disabled={isLoading || !inputQuestion.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIPlaceAssistant;
