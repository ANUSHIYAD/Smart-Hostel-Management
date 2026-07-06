import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { 
  Bot, Sparkles, Send, X, Maximize2, Minimize2, 
  Trash2, Plus, Copy, MessageSquare, Check, History, ChevronRight
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ReactMarkdown from "react-markdown";

export default function AIChatDrawer() {
  const {
    user,
    chatMessages,
    chatLoading,
    isChatOpen,
    setIsChatOpen,
    isChatMaximized,
    setIsChatMaximized,
    chatSessions,
    activeSessionId,
    setActiveSessionId,
    startNewChat,
    clearChatHistory,
    deleteSession,
    sendChatMessage
  } = useApp();

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll to Bottom on New Messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatLoading]);

  // Handle Preset Prompts
  const handlePresetClick = (text: string) => {
    setInput(text);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    const msg = input;
    setInput("");
    sendChatMessage(msg);
  };

  // Copy Message to Clipboard
  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user || user.role !== "student") return null;

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`relative group p-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 hover:scale-105 ${
            isChatOpen 
              ? "bg-zinc-900 border border-zinc-800 text-[#D4AF37]" 
              : "gold-gradient-bg text-zinc-950"
          }`}
          title="Open AI Warden Assistant"
        >
          {isChatOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Sliding Drawer Container */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-screen bg-[#0d0d0d] border-l border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-30 flex overflow-hidden ${
              isChatMaximized ? "w-full max-w-4xl" : "w-full max-w-md"
            }`}
          >
            {/* 1. History Pane (Visible always on Maximized, toggled via state on Normal) */}
            <AnimatePresence>
              {(isChatMaximized || showHistory) && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="h-full bg-[#121212] border-r border-zinc-800/80 flex flex-col shrink-0 overflow-hidden"
                >
                  {/* History Header */}
                  <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs uppercase font-mono tracking-widest text-[#D4AF37] font-semibold flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> Sessions
                    </span>
                    <button
                      onClick={startNewChat}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-[#D4AF37] transition-all flex items-center gap-1"
                      title="New Chat Session"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sessions List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setActiveSessionId(session.id)}
                        className={`group w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                          activeSessionId === session.id
                            ? "bg-zinc-900 border border-zinc-800 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.05)]"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-1">
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeSessionId === session.id ? "text-[#D4AF37]" : "text-zinc-500"}`} />
                          <span className="text-xs truncate font-sans font-medium">{session.title}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-all shrink-0"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/40">
                    <button
                      onClick={clearChatHistory}
                      className="w-full py-2 px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-red-950/20 hover:border-red-500/30 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All History
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. Main Active Chat Pane */}
            <div className="flex-1 flex flex-col h-full relative">
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 bg-[#0d0d0d] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl gold-gradient-bg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                    <Bot className="w-5 h-5 text-zinc-950" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                      HERA Assistant <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Cognitive Grid Online</span>
                    </div>
                  </div>
                </div>

                {/* Control Panel Header Action Row */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-2 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-white transition-all md:hidden`}
                    title="Toggle Session History"
                  >
                    <History className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsChatMaximized(!isChatMaximized)}
                    className="p-2 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-white transition-all hidden md:block"
                    title={isChatMaximized ? "Restore Size" : "Maximize view"}
                  >
                    {isChatMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-red-400 transition-all"
                    title="Minimize panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message Lists */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-[#D4AF37]">
                      <Bot className="w-6 h-6 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">New AI Assistant Session</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      HERA can automate administrative drafts, answer questions about rules, or file maintenance logs instantly.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                        msg.role === "user" ? "bg-zinc-800 text-white" : "gold-gradient-bg text-zinc-950 font-bold"
                      }`}>
                        {msg.role === "user" ? "U" : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1 group">
                        <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans relative ${
                          msg.role === "user"
                            ? "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tr-none"
                            : "bg-zinc-950 border border-[#D4AF37]/10 text-zinc-300 rounded-tl-none"
                        }`}>
                          {msg.role === "user" ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-zinc-300 markdown-body">
                              <ReactMarkdown
                                components={{
                                  code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    const isInline = !match;
                                    return !isInline ? (
                                      <pre className="bg-[#0f0f0f] border border-zinc-800 p-2.5 rounded-lg overflow-x-auto font-mono text-[11px] text-zinc-300 my-2">
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    ) : (
                                      <code className="bg-zinc-900 text-amber-300 px-1 rounded font-mono text-[11px]" {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          )}

                          {/* Float copy button */}
                          <button
                            onClick={() => handleCopy(msg.content, index)}
                            className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-[#D4AF37] text-zinc-500 hover:text-white transition-all shadow-md z-10"
                            title="Copy message content"
                          >
                            {copiedId === index ? <Check className="w-3 h-3 text-[#D4AF37]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Timestamp */}
                        <div className="text-[9px] text-zinc-600 font-mono text-right tracking-wider">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Processing Indicator */}
                {chatLoading && (
                  <div className="flex gap-3 max-w-[90%] mr-auto">
                    <div className="w-8 h-8 rounded-lg shrink-0 gold-gradient-bg text-zinc-950 font-bold flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3.5 rounded-2xl text-xs bg-zinc-950 border border-[#D4AF37]/10 text-zinc-400 font-mono flex items-center gap-2">
                      <span className="flex h-2 w-2 relative shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span>HERA AI is analyzing params and routing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Panel & Input Section */}
              <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 space-y-4 shrink-0">
                {/* Horizontal Quick Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
                  <button 
                    onClick={() => handlePresetClick("I need leave starting tomorrow for 2 days to visit Kolkata")}
                    className="px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    📝 Leave application
                  </button>
                  <button 
                    onClick={() => handlePresetClick("My room tube-light is sparking wildly in B-302")}
                    className="px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    💡 Tube-light sparking
                  </button>
                  <button 
                    onClick={() => handlePresetClick("What is the hostel gate close curfew timing?")}
                    className="px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    ⏰ Check curfew rules
                  </button>
                  <button 
                    onClick={() => handlePresetClick("Register visitor father Ram Dev on tomorrow")}
                    className="px-2.5 py-1.5 rounded-lg bg-[#161616] hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    🚪 Parent visitor pass
                  </button>
                </div>

                {/* Message input bar */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask HERA to draft pass, register visitor, file complaints..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={chatLoading}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading}
                    className="px-4 py-3 gold-gradient-bg text-zinc-950 rounded-xl hover:brightness-110 transition-all font-bold flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
