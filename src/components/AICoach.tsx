import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, RefreshCw, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CoachMessage } from "../types";

interface AICoachProps {
  chatHistory: CoachMessage[];
  onSendMessage: (msg: string) => void;
  onClearHistory: () => void;
  isSending: boolean;
}

export default function AICoach({
  chatHistory,
  onSendMessage,
  onClearHistory,
  isSending
}: AICoachProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const triggerQuickPrompt = (promptText: string) => {
    if (!isSending) {
      onSendMessage(promptText);
    }
  };

  const quickPrompts = [
    { label: "Suggest 3 coffee budget cuts ☕", text: "I'd like to cut my daily premium coffee expenses. Suggest 3 custom budget cuts that I can transfer into my savings wallet." },
    { label: "Estimate my Tokyo completion date 📅", text: "Based on my active auto-save of ₹4,000/week, estimate my completion date and suggest adjustments to accelerate it." },
    { label: "Draft a savings strategy for Rolex 🎯", text: "What savings strategy do you suggest so I can reach my Rolex Submariner Watch goal faster?" }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[450px] glass-panel rounded-3xl overflow-hidden border border-slate-800">
      {/* Coach Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-cyan-400 p-[1px]">
            <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-1.5">
              AI Savings Coach <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">Powered by Gemini 3.5 Flash</p>
          </div>
        </div>

        {/* Clear Trigger */}
        <button
          onClick={onClearHistory}
          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          title="Clear Chat History"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-start space-x-3 max-w-[85%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.sender === "user" ? "bg-slate-800 text-cyan-400" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              }`}>
                {msg.sender === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>

              {/* Text Bubble */}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans ${
                msg.sender === "user"
                  ? "bg-slate-900 text-slate-100 rounded-tr-none border border-slate-800"
                  : "bg-slate-950/80 text-slate-200 rounded-tl-none border border-slate-900/40 shadow-sm"
              }`}>
                {/* Parse key markdown elements manually to look beautiful without heavy react-markdown */}
                <div className="whitespace-pre-wrap">
                  {msg.text.split("\n").map((line, i) => {
                    // Check for lists
                    if (line.startsWith("- ") || line.startsWith("* ")) {
                      return (
                        <div key={i} className="flex items-start space-x-1.5 my-1 pl-1">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      );
                    }
                    
                    // Simple replacement for bold tags
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    if (boldRegex.test(line)) {
                      const parts = line.split(boldRegex);
                      return (
                        <p key={i} className="my-1.5">
                          {parts.map((part, index) => 
                            index % 2 === 1 ? <strong key={index} className="text-emerald-400 font-semibold">{part}</strong> : part
                          )}
                        </p>
                      );
                    }

                    return <p key={i} className="my-1">{line}</p>;
                  })}
                </div>
                <span className="text-[9px] text-slate-500 font-mono block text-right mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loader Bubble */}
        {isSending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-3 max-w-[80%]"
          >
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <div className="p-3.5 bg-slate-950/50 text-slate-400 rounded-2xl rounded-tl-none border border-slate-900 text-xs font-mono">
              Analyzing savings metrics...
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      {chatHistory.length <= 1 && !isSending && (
        <div className="p-4 border-t border-slate-900/60 bg-slate-950/35 space-y-2">
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-2">Suggested Topics</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => triggerQuickPrompt(qp.text)}
                className="bg-slate-900 hover:bg-slate-850 hover:border-emerald-500/30 text-slate-300 text-xs px-3.5 py-1.5 rounded-full border border-slate-800 transition-all text-left flex items-center gap-2 max-w-full"
              >
                <span className="truncate">{qp.label}</span>
                <ArrowRight className="h-3 w-3 flex-shrink-0 text-emerald-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-850 bg-slate-900/20">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask the coach about budgeting hacks, projection rates..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            className="flex-grow bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-2xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 rounded-2xl transition-all shadow-lg shadow-emerald-500/10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
