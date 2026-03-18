import React, { useState, useRef, useEffect } from 'react';
import { generateResponse, SUGGESTED_QUESTIONS, SYSTEM_PROMPT } from '../utils/chatbotKnowledge';

function MarkdownContent({ text }) {
  // Simple markdown renderer for tables, bold, headers, lists, code
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s-|]+\|$/)) {
      const tableLines = [];
      let j = i;
      while (j < lines.length && lines[j].includes('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      const headerCells = tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim());
      const dataRows = tableLines.slice(2).map(row =>
        row.split('|').filter(c => c.trim()).map(c => c.trim())
      );

      elements.push(
        <div key={i} className="overflow-x-auto my-2">
          <table className="w-full text-xs border-collapse min-w-[400px]">
            <thead>
              <tr className="border-b border-gwoe-border">
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="text-left py-1.5 px-2 text-gwoe-muted font-medium">
                    <InlineMarkdown text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className="border-b border-gwoe-border/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-1.5 px-2 text-gwoe-text">
                      <InlineMarkdown text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = j;
      continue;
    }

    // Headers
    if (line.startsWith('**') && line.endsWith('**') && !line.includes('|')) {
      elements.push(
        <p key={i} className="text-sm font-semibold text-white mt-3 mb-1">
          {line.replace(/\*\*/g, '')}
        </p>
      );
      i++;
      continue;
    }

    // List items
    if (line.match(/^[-•]\s/) || line.match(/^\d+\.\s/)) {
      elements.push(
        <p key={i} className="text-xs text-gwoe-text pl-3 py-0.5 leading-relaxed">
          <InlineMarkdown text={line} />
        </p>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-xs text-gwoe-text leading-relaxed py-0.5">
        <InlineMarkdown text={line} />
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

function InlineMarkdown({ text }) {
  // Handle **bold**, `code`, and plain text
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    let firstMatch = null;
    let firstIndex = remaining.length;

    if (boldMatch && boldMatch.index < firstIndex) {
      firstMatch = { type: 'bold', match: boldMatch };
      firstIndex = boldMatch.index;
    }
    if (codeMatch && codeMatch.index < firstIndex) {
      firstMatch = { type: 'code', match: codeMatch };
      firstIndex = codeMatch.index;
    }

    if (!firstMatch) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (firstIndex > 0) {
      parts.push(<span key={key++}>{remaining.substring(0, firstIndex)}</span>);
    }

    if (firstMatch.type === 'bold') {
      parts.push(<strong key={key++} className="text-white font-medium">{firstMatch.match[1]}</strong>);
    } else {
      parts.push(<code key={key++} className="text-gwoe-accent bg-gwoe-accent/10 px-1 py-0.5 rounded text-xs">{firstMatch.match[1]}</code>);
    }

    remaining = remaining.substring(firstIndex + firstMatch.match[0].length);
  }

  return <>{parts}</>;
}

export default function Chatbot({ allRoles }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text) => {
    const question = text || input.trim();
    if (!question) return;

    const userMsg = { role: 'user', content: question, timestamp: new Date() };
    const context = { allRoles: allRoles || [] };
    const response = generateResponse(question, context);
    const botMsg = {
      role: 'assistant',
      title: response.title,
      content: response.content,
      confidence: response.confidence,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gwoe-accent/30 to-gwoe-green/30 flex items-center justify-center border border-gwoe-accent/30 flex-shrink-0">
            <span className="text-lg">💬</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Offshore Strategy Advisor</h2>
            <p className="text-xs text-gwoe-muted">Ask about offshoring, capacity, providers, transitions, and more</p>
          </div>
        </div>
        <button
          onClick={() => setShowSystemPrompt(!showSystemPrompt)}
          className="text-xs text-gwoe-muted hover:text-gwoe-accent transition-colors px-3 py-1.5 border border-gwoe-border rounded-md self-start"
        >
          {showSystemPrompt ? 'Hide' : 'View'} System Prompt
        </button>
      </div>

      {/* System Prompt Display */}
      {showSystemPrompt && (
        <div className="card p-4 mb-4 border-gwoe-accent/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gwoe-accent uppercase tracking-wider">System Prompt</span>
          </div>
          <pre className="text-xs text-gwoe-text whitespace-pre-wrap font-mono leading-relaxed bg-gwoe-bg rounded-md p-3">
            {SYSTEM_PROMPT}
          </pre>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-6">
            {/* Welcome */}
            <div className="card p-5 sm:p-6 text-center">
              <p className="text-3xl mb-3">🌐</p>
              <h3 className="text-base font-semibold text-white mb-2">Welcome to the Offshore Strategy Advisor</h3>
              <p className="text-xs text-gwoe-muted max-w-lg mx-auto leading-relaxed">
                I'm here to help you navigate offshoring decisions. I have deep knowledge of offshore markets,
                providers, employee relations, governance models, and capacity planning — and I'll use your actual
                GWOE workforce data ({allRoles?.length || 0} roles) to personalize my answers.
              </p>
            </div>

            {/* Suggested Questions */}
            <div>
              <p className="text-xs text-gwoe-muted uppercase tracking-wider mb-3 px-1">Suggested Questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sq.question)}
                    className="text-left px-4 py-3 bg-gwoe-card border border-gwoe-border rounded-lg hover:border-gwoe-accent/40 hover:bg-gwoe-accent/5 transition-colors group"
                  >
                    <span className="text-xs font-medium text-gwoe-accent group-hover:text-gwoe-accent-glow">{sq.label}</span>
                    <p className="text-xs text-gwoe-muted mt-0.5">{sq.question}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-gwoe-accent/20 border border-gwoe-accent/30 rounded-lg px-4 py-3 max-w-[85%] sm:max-w-[70%]">
                <p className="text-sm text-white">{msg.content}</p>
              </div>
            ) : (
              <div className="card p-4 sm:p-5 max-w-full sm:max-w-[90%] w-full">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-gwoe-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">🌐</span>
                  </div>
                  <span className="text-sm font-medium text-white">{msg.title}</span>
                  {msg.confidence > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      msg.confidence >= 80 ? 'bg-gwoe-green/20 text-gwoe-green' :
                      msg.confidence >= 60 ? 'bg-gwoe-accent/20 text-gwoe-accent' :
                      'bg-gwoe-amber/20 text-gwoe-amber'
                    }`}>
                      {msg.confidence}% match
                    </span>
                  )}
                </div>
                <MarkdownContent text={msg.content} />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gwoe-border pt-4 mt-auto">
        {messages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
            {SUGGESTED_QUESTIONS.filter((_, i) => i < 4).map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq.question)}
                className="text-xs px-3 py-1.5 border border-gwoe-border rounded-full text-gwoe-muted hover:text-gwoe-accent hover:border-gwoe-accent/40 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {sq.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about offshoring strategy, capacity, providers, employee relations..."
            className="input-field flex-1"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="btn-primary px-4 sm:px-6 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gwoe-muted mt-2 text-center">
          Responses are generated from a curated knowledge base using your live workforce data. Not connected to an external AI model.
        </p>
      </div>
    </div>
  );
}
