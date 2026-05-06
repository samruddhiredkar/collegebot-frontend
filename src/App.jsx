import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { text: "👋 Hi! I'm your **CollegeBot**. What engineering topic are we tackling?", sender: 'bot' }
  ]);

  const SUGGESTIONS = [
  "Explain Pointers in C", 
  "Digital Electronics Module 3", 
  "Physics Lab Viva Questions"
  ];
  // Dynamic Chat History State
  const [chatHistory, setChatHistory] = useState([]);
  
  // NEW: Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // SMART RESET: Starts a new chat and archives the old one only if it's not empty
  const startNewChat = () => {
    // Close sidebar on mobile even if empty
    setIsSidebarOpen(false);

    // Check if there's an actual conversation worth saving
    if (messages.length <= 1) {
      return; 
    }

    // Archive the current chat
    const firstUserMsg = messages.find(m => m.sender === 'user')?.text || "New Discussion";
    const shortTitle = firstUserMsg.substring(0, 25) + (firstUserMsg.length > 25 ? "..." : "");
    
    const newHistoryItem = {
      id: Date.now(),
      title: shortTitle,
      fullConversation: [...messages]
    };
    
    setChatHistory(prev => [newHistoryItem, ...prev]);
    
    // Clear the UI for the new session
    setMessages([{ text: "🚀 Ready for a new topic! What's on your mind?", sender: 'bot' }]);
  };

  // Loads a past chat from the sidebar back into the main window
  const loadPastChat = (historyItem) => {
    setMessages(historyItem.fullConversation);
    // NEW: Close sidebar on mobile after clicking a history item
    setIsSidebarOpen(false);
  };

  const handleSuggestion = (text) => {
  setInput(text);
  };
  

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = { text: input, sender: 'user' };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    
    try {
      // Calling your FastAPI backend
      const response = await fetch(`https://collegebot-backend-7heg.onrender.com/ask?question=${encodeURIComponent(input)}`);
      const data = await response.json();
      
      const botMsg = { text: data.answer, sender: 'bot' };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, { text: "❌ **Error:** Connection failed. Make sure your backend is running!", sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR - Updated with dynamic class for mobile */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button className="new-chat-btn" onClick={startNewChat}>+ New Chat</button>
        <div className="history-section">
          <h3>Recent History</h3>
          <div className="history-list">
            {chatHistory.length === 0 && <p className="empty-history">No history yet</p>}
            {chatHistory.map((item) => (
              <div key={item.id} className="history-item" onClick={() => loadPastChat(item)}>
                💬 {item.title}
              </div>
            ))}
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="api-status">
            <span className="status-dot"></span>
            <span>Llama-3-Groq Online</span>
          </div>
          <div className="version-tag">v2.0</div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="app-container">
        {/* HEADER - Updated with Hamburger Menu Button */}
        <header className="chat-header">
          <div className="header-info" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              ☰
            </button>
            <div>
              <h1>CollegeBot</h1>
              <p>Engineering Study Assistant</p>
            </div>
          </div>
        </header>

        <div className="chat-window">
          <div className="chat-content-centered">
            {messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.sender}`}>
                <div className={`message-bubble ${msg.sender}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message-wrapper bot">
                <div className="message-bubble bot">Thinking... 🧠</div>
              </div>
            )}
            {messages.length <= 1 && (
              <div className="suggestions-container">
                {SUGGESTIONS.map((text, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSuggestion(text)}>
                  {text}
                </button>
              ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about Digital Electronics, C, or AI..."
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
