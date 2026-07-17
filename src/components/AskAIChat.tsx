import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { X, Send, Compass, User, Sparkles, MessageSquare, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AskAIChatProps {
  placeName: string;
  roleType: string; // "Local Tour Guide", "History Professor", "Architecture Expert", "Business Insider"
  onClose: () => void;
}

export default function AskAIChat({ placeName, roleType, onClose }: AskAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message based on selected AI Persona
  useEffect(() => {
    let greeting = "";
    switch (roleType) {
      case "History Professor":
        greeting = `Welcome! I am your academic research guide. Ask me anything regarding the historic background, founding years, colonial impacts, or national significance of **${placeName}**!`;
        break;
      case "Architecture Expert":
        greeting = `Greetings! I specialize in design and structural elements. Ask me about the architectural style, materials used, designers, or construction milestones of **${placeName}**!`;
        break;
      case "Business Insider":
        greeting = `Hello. I represent local commercial records. Ask me about the ownership, services, popularity, and public offerings of **${placeName}**!`;
        break;
      default:
        greeting = `Hi there! I'm your friendly local tour guide. Ask me about **${placeName}**! I'd love to share the local tales, legends, and best surrounding tips with you!`;
    }

    setMessages([
      {
        id: "welcome-msg",
        role: "model",
        content: greeting,
        createdAt: new Date().toLocaleTimeString()
      }
    ]);
  }, [placeName, roleType]);

  // Scroll to bottom whenever messages list is updated
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent, manualText?: string) => {
    e?.preventDefault();
    const textToSend = manualText || inputValue;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setLoading(true);

    try {
      const historyToSend = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/places/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName,
          messages: historyToSend,
          roleType
        })
      });

      const data = await res.json();
      if (data.status === "success") {
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: "model",
            content: data.message,
            createdAt: new Date().toLocaleTimeString()
          }
        ]);
      } else {
        throw new Error(data.message || "Failure to generate response.");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          content: `I'm sorry, I encountered a connection issue: ${err.message}. Please verify your network and check secrets config if necessary.`,
          createdAt: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_SUGGESTIONS = [
    "Tell me about its history",
    "What are some interesting facts?",
    "Why is this place important?",
    "Give me a 30-second summary"
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 text-slate-100 shadow-2xl relative select-text" id="ai-chat-thread">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-blue-500 leading-none mb-0.5">
              AI Chat - {roleType}
            </div>
            <div className="text-sm font-extrabold text-white leading-none truncate max-w-[180px]">
              {placeName}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800/60 transition-colors"
          title="Exit conversation"
          id="close-chat-btn"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Suggestion tags header */}
      {messages.length === 1 && (
        <div className="px-5 py-3 border-b border-slate-900/80 bg-slate-900/30">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Select follow-up prompts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => handleSendMessage(e, item)}
                className="text-[10px] font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-full transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Thread Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m) => {
          const isModel = m.role === "model";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 max-w-[90%] ${
                isModel ? "self-start" : "ml-auto flex-row-reverse"
              }`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
                isModel
                  ? "bg-blue-600/10 border-blue-500/20 text-blue-400"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}>
                {isModel ? <Compass className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
              </div>

              {/* Message Box */}
              <div className="space-y-1">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                  isModel
                    ? "bg-slate-900/85 text-slate-200 border border-slate-800/50 rounded-tl-sm shadow"
                    : "bg-blue-600 text-white rounded-tr-sm shadow-md"
                }`}>
                  {isModel ? (
                    <div className="prose prose-invert prose-xs">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{m.content}</p>
                  )}
                </div>
                <div className={`text-[9px] text-slate-500 font-bold px-1 ${
                  isModel ? "" : "text-right"
                }`}>
                  {m.createdAt}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 max-w-[90%]">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center animate-spin">
              <Compass className="h-4.5 w-4.5" />
            </div>
            <div className="bg-slate-900/85 border border-slate-800/50 p-3 rounded-2xl rounded-tl-sm shadow">
              <div className="flex gap-1">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Form Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="px-5 py-4 border-t border-slate-900/80 bg-slate-900/40 backdrop-blur flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Ask the ${roleType}...`}
          className="flex-1 bg-slate-950 border border-slate-800 focus:outline-none focus:border-blue-500 text-xs text-slate-100 rounded-xl px-4 py-3 shadow"
          id="chat-input"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white p-3 rounded-xl transition-all shadow"
          title="Send query"
          id="send-chat-btn"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
