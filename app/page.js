// pages/index.js
"use client";
import { useState, useEffect, useRef } from 'react';
import { Heart, HeartOff, Copy, Share, X, MessageCirclePlus, PanelRight, Send, Badge} from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {motion} from 'framer-motion';
import DOMPurify from "dompurify";
import Head from 'next/head';
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.css";
import './style.css';
export default function ChittiChat() {
  const { data: session, status} = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidePanel, setSidePanel] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const messagesEndRef = useRef(null);

 const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

 // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Load chat history when user logs in
  useEffect(() => {
    if (session) {
      fetchChatList();
    }
  }, [session]);

 // Session loading state
  if (status === 'loading') {
    return (
      <div className="load">
        <div><motion.div 
        animate={{rotate:360}} 
        transition={{duration:1}}>
        <Badge id="badge-icon" strokeWidth={1}/>
      </motion.div>
    </div>
      </div>
    );
  }


  const fetchChatList = async () => {
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();
      setChatList(data);
    } catch (error) {
      console.error('Error fetching chat list:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      content: input,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          chatId: activeChat,
          userId: session.user.id
        }),
      });

      const data = await response.json();
      
      if (data.response) {
        const aiMessage = {
          id: Date.now() + 1,
          content: data.response,
          role: 'assistant',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (!activeChat) {
          fetchChatList();
          setActiveChat(data.chatId);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setActiveChat(null);
  };

  const loadChat = async (chatId) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      const data = await response.json();
      setMessages(data.messages || []);
      setActiveChat(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleLike = async (messageId, liked) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          liked,
          userId: session.user.id
        }),
      });
      
      // Update local state to reflect the like
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? {...msg, liked} : msg
      ));
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const shareMessage = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Message from Chitti',
          text: text
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(text);
      alert('Message copied to clipboard');
    }
  };

  if (!session) {
    return (
      <div className="box">
        <Head>
          <title>Hypr - Login</title>
        </Head>
        <div className="container">
          <h1 className="head">Hypr</h1>
          <p className="p">Advanced AI Chatbot</p>
          <button 
            onClick={() => signIn('google')}
            className="btn"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }


marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

const MP = ({ content }) => {
  useEffect(() => {
    hljs.highlightAll(); 
  }, [content]);

  const html = DOMPurify.sanitize(marked(content));

  useEffect(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      const pre = block.parentNode;
      if (pre.querySelector(".copy-btn")) return; 

      const button = document.createElement("button");
      button.innerText = "Copy";
      button.className = "copy-code-btn";
      button.onclick = () => {
        navigator.clipboard.writeText(block.innerText);
        button.innerText = "Copied!";
        setTimeout(() => (button.innerText = "Copy"), 2000);
      };

      pre.style.position = "relative";
      pre.appendChild(button);
    });
  }, [content]);

  return (
    <div
      className="message-text prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};


  return (
   <div className="app">
  <Head>
    <title>Hypr - Advanced AI Chatbot</title>
  </Head>

  {/* Sidebar */}
  <div className="sidebar">
    <div className="sidebar-header">
    <div className="sub-sidebar-header">
<img src='./hyprlyflogo.png' />
    </div>
    <div className="sub-sidebar-header">
      <h1 className="sidebar-title">Hypr</h1>
      <p className="sidebar-subtitle">Your AI friend</p>
    </div>
    </div>
    
    <button onClick={createNewChat} className="new-chat-btn">
      + New Chat
    </button>
    
    <div className="chat-history">
      <h2 className="chat-history-title">Chat History</h2>
      <ul>
        {chatList.map(chat => (
          <li 
            key={chat.id} 
            className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
            onClick={() => loadChat(chat.id)}
          >
            <div className="chat-title">{chat.title || "New Chat"}</div>
            <div className="chat-date">
              {new Date(chat.timestamp).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
    <div className="sidebar-footer">
      <div className="user-info">
        <img src={session.user.image} alt={session.user.name} className="user-avatar" />
        <div className="user-details">
          <p className="user-name">{session.user.name}</p>
          <button onClick={() => signOut()} className="signout-btn">
            Sign out
          </button>
        </div>
      </div>
    </div>
  </div>
  {/* end Sidebar */}


  {/* Mob-Sidebar */}
    {sidePanel && (
<div className="mob-sidebar">
    <div className="sidebar-header">
    <div className="sub-sidebar-header">
<img src='./hyprlyflogo.png' />
    </div>
    <div className="sub-sidebar-header">
<button onClick={()=>setSidePanel(false)}><X/></button>
    </div>
    </div>
    
    <button onClick={createNewChat} className="new-chat-btn">
      + New Chat
    </button>
    
    <div className="chat-history">
      <h2 className="chat-history-title">Chat History</h2>
      <ul>
        {chatList.map(chat => (
          <li 
            key={chat.id} 
            className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
            onClick={() => loadChat(chat.id)}
          >
            <div className="chat-title">{chat.title || "New Chat"}</div>
            <div className="chat-date">
              {new Date(chat.timestamp).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
    <div className="sidebar-footer">
      <div className="user-info">
        <img src={session.user.image} alt={session.user.name} className="user-avatar" />
        <div className="user-details">
          <p className="user-name">{session.user.name}</p>
          <button onClick={() => signOut()} className="signout-btn">
            Sign out
          </button>
        </div>
      </div>
    </div>
  </div>
    )}
  
  {/* end Sidebar */}



  {/* Main Chat Area */}
  <div className="chat-area">
    {/* Messages */}
    <div className="messages">
      {messages.length === 0 ? (
        <div className="welcome">
        <img src='./hyprlyflogo.png' />
          <h2 className="welcome-title">Welcome to Hypr!</h2>
          <p className="welcome-subtitle">Start a conversation by typing a message below.</p>
        </div>
      ) : (
        messages.map(message => (
          <div 
            key={message.id} 
            className={`message-row ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className={`message-bubble ${message.role}`}>
              <div className="message-content">
                <MP content={message.content}/>
                <p className="message-time">
                </p>
              </div>  
              
              {message.role === 'assistant' && !message.error && (
                <div className="message-actions">
                  <button 
                    onClick={() => handleLike(message.id, message.liked !== true)}
                    className={`like-btn ${message.liked ? 'liked' : ''}`}
                  ><Heart id="icon" /></button>
                  <button 
                    onClick={() => handleLike(message.id, message.liked === false ? null : false)}
                    className={`dislike-btn ${message.liked === false ? 'disliked' : ''}`}
                  ><HeartOff id="icon" /></button>
                  <button onClick={() => copyToClipboard(message.content)} className="copy-btn"><Copy id="icon" /></button>
                  <button onClick={() => shareMessage(message.content)} className="share-btn"><Share id="icon" /></button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      {loading && (
        <div className="message-row assistant">
          <div className="message-bubble assistant typing">
            <div className="dots">
              <div></div><div></div><div></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* Input Form */}
    <div className="chat-input">
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          className="input-field"
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="send-btn">
          <Send id='icon'/>
        </button>
      </form>
    </div>
  </div>






<div className="opt">
<nav>
<div id='nav-box'><button onClick={()=>setSidePanel(true)}><PanelRight strokeWidth={1}/></button></div>
<div id='nav-box-nam'>Hypr</div>
<div id='nav-box'><button onClick={createNewChat}><MessageCirclePlus strokeWidth={1}/></button></div>
  </nav>
<div className="mob-chat-area">
  
    {/* Messages */}
    <div className="messages">
      {messages.length === 0 ? (
        <div className="welcome">
        <img src='./hyprlyflogo.png' />
          <h2 className="welcome-title">Welcome to Hypr!</h2>
          <p className="welcome-subtitle">Start a conversation by typing a message below.</p>
        </div>
      ) : (
        messages.map(message => (
          <div 
            key={message.id} 
            className={`message-row ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            <div className={`message-bubble ${message.role}`}>
              <div className="message-content">
                <MP content={message.content}/>
                <p className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>  
              
              {message.role === 'assistant' && !message.error && (
                <div className="message-actions">
                  <button 
                    onClick={() => handleLike(message.id, message.liked !== true)}
                    className={`like-btn ${message.liked ? 'liked' : ''}`}
                  ><Heart id="icon" /></button>
                  <button 
                    onClick={() => handleLike(message.id, message.liked === false ? null : false)}
                    className={`dislike-btn ${message.liked === false ? 'disliked' : ''}`}
                  ><HeartOff id="icon" /></button>
                  <button onClick={() => copyToClipboard(message.content)} className="copy-btn"><Copy id="icon" /></button>
                  <button onClick={() => shareMessage(message.content)} className="share-btn"><Share id="icon" /></button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      {loading && (
        <div className="message-row assistant">
          <div className="message-bubble assistant typing">
            <div className="dots">
              <div></div><div></div><div></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* Input Form */}
    <div className="chat-input">
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
          className="input-field"
          disabled={loading}
        />
        <button type="submit" disabled={loading} className="send-btn">
          <Send id='icon'/>
        </button>
      </form>
    </div>
  </div>
</div>

</div>

  );
}