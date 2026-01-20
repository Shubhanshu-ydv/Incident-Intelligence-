import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Mic, Bot, User, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AIChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export function AIChat({ messages, onSendMessage }: AIChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSendMessage(suggestion);
  };

  const suggestions = [
    "What are the critical severity incidents currently open?",
    "Which location has the most active incidents?",
    "Show all active incidents",
    "What incidents are related to network connectivity?"
  ];

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-slate-900 font-semibold">AI Assistant</h2>
            <p className="text-sm text-slate-500">Ask me anything about your incidents</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
        {messages.length === 0 ? (
          <div className="flex items-start justify-center h-full pt-8">
            <div className="max-w-sm w-full p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-blue-600" />
                </div>
              </div>

              {/* Welcome text */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                  Ask questions. Understand incidents. See how AI reasons.
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Powered by RAG • Explainable AI
                </p>
              </div>

              {/* Suggested questions */}
              <div className="space-y-2">
                <p className="text-xs text-gray-600 text-center mb-2.5">Try asking:</p>
                {/* Two buttons side by side - top row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSuggestionClick(suggestions[0])}
                    className="px-3 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
                  >
                    {suggestions[0]}
                  </button>
                  <button
                    onClick={() => handleSuggestionClick(suggestions[1])}
                    className="px-3 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
                  >
                    {suggestions[1]}
                  </button>
                </div>
                {/* Two buttons side by side - bottom row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSuggestionClick(suggestions[2])}
                    className="px-3 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
                  >
                    {suggestions[2]}
                  </button>
                  <button
                    onClick={() => handleSuggestionClick(suggestions[3])}
                    className="px-3 py-2 text-xs text-gray-800 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
                  >
                    {suggestions[3]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-2xl ${message.sender === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                      }`}
                  >
                    <div className="whitespace-pre-wrap">{message.message}</div>
                    {message.incidentRefs && message.incidentRefs.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.incidentRefs.map(ref => (
                          <span
                            key={ref}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`mt-1 flex items-center justify-between text-xs ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className="text-slate-400">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-2.5 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="flex gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-lg transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try: 'Why are incidents increasing in B1?'"
            className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
