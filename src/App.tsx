import { useState } from 'react';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const messageText = input.trim();
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('Server did not return a response');
      }

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        console.log('💾 Saved sessionId:', data.sessionId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to get response. Make sure the server is running and Ollama is working.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <h1>🤖 Ollama LangGraph Agent</h1>
          <p>Ask the agent a question</p>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <p>👋 Hello! I'm an AI assistant based on Ollama and LangGraph.</p>
              <p>Ask me any question!</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                </span>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="message-content">
                <span className="typing-indicator">...</span>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your message..."
            rows={3}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

