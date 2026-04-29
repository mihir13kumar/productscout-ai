import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import useAppStore from '../store/useAppStore';
import { Bot, User, Loader2, Send, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

/* ---------- Typing Indicator ---------- */
const TypingIndicator = () => (
  <div className="flex items-start gap-4 max-w-3xl mx-auto px-4 py-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-border flex items-center justify-center mt-0.5">
      <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
    </div>
    <div className="flex items-center gap-1.5 pt-2">
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

/* ---------- Code Block with Copy ---------- */
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match && !className?.includes('hljs');

  if (isInline) {
    return <code className={className} {...props}>{children}</code>;
  }

  const language = match ? match[1] : 'code';

  const handleCopy = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(codeRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-1.5 bg-muted border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm leading-relaxed max-w-full">
        <code ref={codeRef} className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
};

/* ---------- Message ---------- */
const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`w-full py-4 ${isUser ? '' : ''}`}>
      <div className={`max-w-3xl mx-auto px-4 flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>



        {/* Message Content */}
        <div className={`flex flex-col min-w-0 pt-0.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-center mb-1.5`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 size-6 rounded-full overflow-hidden border flex items-center justify-center mt-0.5 ${isUser ? 'bg-foreground border-foreground' : 'bg-muted border-border'
              }`}>
              {isUser
                ? <User className="w-4 h-4 text-background" />
                : <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
              }
            </div>
            <p className={`text-xs font-medium ${isUser ? 'text-foreground' : 'text-muted-foreground'}`}>
              {isUser ? 'You' : 'ProductScout AI'}
            </p>
          </div>

          <div className={`rounded-2xl max-w-full ${isUser
            ? 'bg-muted text-foreground rounded-tr-sm px-4 py-2.5'
            : 'bg-transparent text-foreground'
            }`}>
            {isUser ? (
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <div className="prose max-w-full overflow-x-hidden">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{ code: CodeBlock }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <p className={`text-xs text-muted-foreground/50 mt-1.5 ${isUser ? 'text-right pr-1' : 'pl-1'}`}>{msg.time}</p>
        </div>

      </div>
    </div>
  );
};

/* ---------- Empty State ---------- */
const EmptyState = ({ onQuickPrompt }) => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border flex items-center justify-center mb-4">
      <img src="/logo.png" alt="AI" className="w-full h-full object-cover" />
    </div>
    <h2 className="text-foreground text-base font-semibold mb-1">Product loaded</h2>
    <p className="text-muted-foreground text-sm mb-6">Ask anything about this product</p>
    <div className="flex flex-wrap gap-2 justify-center max-w-md">
      {['What is the price?', 'Key specifications?', 'Pros and cons?', 'Is it worth buying?', 'Compare with similar products'].map((q) => (
        <button
          key={q}
          onClick={() => onQuickPrompt(q)}
          className="px-3 py-1.5 bg-muted hover:bg-muted/80 border border-border rounded-full text-xs text-muted-foreground hover:text-foreground transition-all"
        >
          {q}
        </button>
      ))}
    </div>
  </div>
);

/* ---------- Chat Input ---------- */
export const ChatInput = () => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const { messages, addMessage, updateLastMessage, url } = useAppStore();
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Prevent zig-zag jitter by using 'auto' instead of 'smooth' when streaming
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    }
  }, [messages, showTyping, isStreaming]);

  // expose bottomRef so HomePage can attach it
  useEffect(() => {
    window.__chatBottomRef = bottomRef;
  }, []);

  const getTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const send = async (text) => {
    if (!text.trim() || isStreaming) return;

    const userMessage = text.trim();
    const isFirstMessage = messages.length === 0;

    setInput('');
    addMessage({ role: 'user', content: userMessage, id: Date.now(), time: getTime() });
    setIsStreaming(true);
    setShowTyping(true);

    try {
      // If first message, fetch title asynchronously
      if (isFirstMessage && url) {
        fetch('http://localhost:8000/chat/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, question: userMessage, session_id: 'default' }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.title) useAppStore.getState().setTitle(data.title);
          })
          .catch(err => console.error("Title error:", err));
      }

      const response = await fetch('http://localhost:8000/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, question: userMessage, session_id: 'default' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let firstChunk = true;
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const raw = decoder.decode(value, { stream: true });
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') { done = true; break; }
          try {
            const data = JSON.parse(payload);
            if (data.chunk) {
              if (firstChunk) {
                setShowTyping(false);
                addMessage({ role: 'assistant', content: '', id: Date.now(), time: getTime() });
                firstChunk = false;
              }
              updateLastMessage(data.chunk);
            } else if (data.error) {
              setShowTyping(false);
              addMessage({ role: 'assistant', content: `**Error:** ${data.error}`, id: Date.now(), time: getTime() });
              firstChunk = false;
            }
          } catch (_) { }
        }
      }
    } catch (err) {
      setShowTyping(false);
      addMessage({ role: 'assistant', content: `**Connection error:** ${err.message}`, id: Date.now(), time: getTime() });
    } finally {
      setShowTyping(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleQuickPrompt = (e) => {
      const q = e.detail;
      send(q);
    };
    window.addEventListener('quick-prompt', handleQuickPrompt);
    return () => window.removeEventListener('quick-prompt', handleQuickPrompt);
  }, [url]);

  const handleSubmit = (e) => { e.preventDefault(); send(input); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <>
      {/* showTyping rendered in-flow above sticky bar */}
      {showTyping && <TypingIndicator />}

      {/* Invisible scroll anchor — lives in the flow, NOT inside sticky footer */}
      <div ref={bottomRef} className="pb-16" />

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-40 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="Ask about this product..."
              rows={1}
              className="flex-1 bg-muted border border-border focus:border-ring focus:ring-2 focus:ring-ring rounded-xl text-foreground text-sm px-4 py-3 resize-none outline-none transition-all disabled:opacity-50 placeholder:text-muted-foreground"
              style={{ minHeight: '46px', maxHeight: '160px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
            />
            <Button
              type="submit"
              tooltip="Send message"
              disabled={isStreaming || !input.trim()}
              className="flex-shrink-0 w-11 h-11 bg-foreground hover:opacity-90 disabled:opacity-30 text-background rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed [&_svg]:size-4"
            >
              {isStreaming
                ? <Loader2 className="animate-spin" />
                : <Send />
              }
            </Button>
          </form>
          <p className="text-xs text-muted-foreground/40 mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
};

/* ---------- Main export: Messages List ---------- */
const ChatMessages = () => {
  const messages = useAppStore((s) => s.messages);

  return (
    <div className="flex-1 w-full">
      {messages.length === 0
        ? null  // empty state handled by parent
        : messages.map((msg, i) => <Message key={msg.id || i} msg={msg} />)
      }
    </div>
  );
};

export { EmptyState };
export default ChatMessages;
