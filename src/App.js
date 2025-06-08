import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Sun, Moon, Zap, Heart, Smile, Laugh, User, MessageSquare,
  Settings, HelpCircle, Edit, X, Check, ChevronLeft, ArrowRight
} from 'lucide-react';
import BuddyOnboarding from './components/onboarding/BuddyOnboarding';

const BuddyChat = () => {
  // Color scheme
  const colors = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    darkBg: '#0f172a',
    lightBg: '#f8fafc',
    darkCard: '#1e293b',
    lightCard: '#ffffff',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: '',
    hobbies: '',
    favorites: '',
    additionalInfo: ''
  });
  const [buddyMood, setBuddyMood] = useState('happy');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeView, setActiveView] = useState('chat');
  const [tempProfile, setTempProfile] = useState({ ...userProfile });
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  };

  // Mood states
  const moodStates = {
    happy: { emoji: '😊', color: colors.primary, animation: 'none' },
    excited: { emoji: '🤩', color: colors.accent, animation: 'pulse' },
    confused: { emoji: '🤔', color: colors.warning, animation: 'bounce' },
    thinking: { emoji: '🤨', color: colors.secondary, animation: 'float' },
    sad: { emoji: '😢', color: colors.error, animation: 'none' }
  };

  // Load data from localStorage on mount
  useEffect(() => {
  // Load theme preference
  const savedTheme = localStorage.getItem('buddyThemePreference');
  if (savedTheme) {
    setIsDarkMode(savedTheme === 'dark');
  }

  // Load user profile
  const savedProfile = localStorage.getItem('buddyUserProfile');
  if (savedProfile) {
    const profile = JSON.parse(savedProfile);
    setUserProfile(profile);
    setTempProfile(profile);
  }

  // Load session data
  const savedSession = localStorage.getItem('buddySession');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    setSessionId(session.sessionId);
    setMessages(session.messages || []);
    setShowOnboarding(false);
  } else {
    // Only set showOnboarding to true if there is no user profile
    if (!savedProfile) {
      setShowOnboarding(true);
    }
  }
}, []);


  // Save theme preference when it changes
  useEffect(() => {
    localStorage.setItem('buddyThemePreference', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Save session data when messages change
  useEffect(() => {
    if (sessionId) {
      const sessionData = {
        sessionId,
        messages,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('buddySession', JSON.stringify(sessionData));
    }
  }, [messages, sessionId]);

  // Auto-scroll only the messages container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  // API call to create a new session
const createSession = async (profile) => {
  try {
    const response = await fetch('http://localhost:8000/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        onboarding_data: {
          name: profile.name,
          favorite_thing: profile.favorites,
          hobbies: profile.hobbies ? profile.hobbies.split(',').map(item => item.trim()) : [],
          personality_traits: ["friendly", "funny", "supportive"],
          fun_facts: profile.additionalInfo ? [profile.additionalInfo] : ["No additional info provided"]
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    const data = await response.json();
    const newSessionId = data.session_id;

    // Save the new session with proper timestamp
    const initialMessage = {
      id: Date.now(),
      text: data.message,
      sender: 'buddy',
      timestamp: new Date(),
      mood: 'excited'
    };

    setSessionId(newSessionId);
    setMessages([initialMessage]);

    localStorage.setItem('buddySession', JSON.stringify({
      sessionId: newSessionId,
      messages: [initialMessage],
      timestamp: new Date().toISOString()
    }));

    return data.message;
  } catch (error) {
    console.error('Error creating session:', error);
    return `Hey ${profile.name}! I'm your buddy! Let's chat!`;
  }
};

  // API call to send a message
  const sendMessageToAPI = async (message) => {
    if (!sessionId) {
      console.error('No session ID available');
      return "I'm having trouble connecting to my brain right now. Let's try again!";
    }

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      return "Oops! I think I dropped my brain! 🤯 Let's try that again!";
    }
  };

  // API call to restore session
const restoreSession = async () => {
  if (!sessionId) return;

  try {
    const response = await fetch(`http://localhost:8000/session/${sessionId}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to restore session');
    }

    const data = await response.json();
    const restoredMessages = data.messages.map(msg => ({
      id: Date.now() + Math.random(),
      text: msg.content,
      sender: msg.type === 'user' ? 'user' : 'buddy',
      timestamp: new Date(), // Create new Date object for current time
      mood: 'happy'
    }));

    setMessages(restoredMessages);
  } catch (error) {
    console.error('Error restoring session:', error);
    // If session restoration fails, clear the session
    localStorage.removeItem('buddySession');
    setSessionId(null);
    setMessages([]);
  }
};

  // Add message functions
  const addBuddyMessage = (text, mood = 'happy') => {
    setBuddyMood(mood);
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'buddy',
      timestamp: new Date(),
      mood
    }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = inputMessage;
    setInputMessage('');
    addUserMessage(userMsg);

    setIsTyping(true);

    try {
      const response = await sendMessageToAPI(userMsg);
      addBuddyMessage(response);
    } catch (error) {
      console.error('Error:', error);
      addBuddyMessage("Sorry, I'm having trouble connecting to my brain right now. Let's try again!", 'confused');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

const handleOnboardingSubmit = async (profile) => {
  setUserProfile(profile);
  setTempProfile(profile);
  localStorage.setItem('buddyUserProfile', JSON.stringify(profile));

  // Create session with the API
  const welcomeMessage = await createSession(profile);
  setShowOnboarding(false);
  setActiveView('chat');
};

  const getRandomPrompt = () => {
    const prompts = [
      "What's something that made you smile recently?",
      "If you could travel anywhere right now, where would you go?",
      "What's your favorite way to spend a lazy Sunday?",
      "What's something you're really proud of?",
      "What's the best meal you've had recently?",
      "What's a book or movie that really impacted you?",
      "What's something you're looking forward to?",
      "What's a hobby you've always wanted to try?",
      "What's your favorite season and why?",
      "What's something that always cheers you up?"
    ];
    setInputMessage(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleSettingsClick = () => {
    setActiveView('settings');
    setTempProfile({ ...userProfile });
  };

  const handleBackToChat = () => {
    setActiveView('chat');
  };

  const handleSaveSettings = () => {
    setUserProfile({ ...tempProfile });
    localStorage.setItem('buddyUserProfile', JSON.stringify(tempProfile));
    setActiveView('chat');
    addBuddyMessage(`Thanks for updating your profile, ${tempProfile.name}! 😊 I've saved your new information.`, 'happy');
  };

  const handleCancelSettings = () => {
    setTempProfile({ ...userProfile });
    setActiveView('chat');
  };

  const handleEndSession = () => {
    // Clear session data
    localStorage.removeItem('buddySession');
    setSessionId(null);
    setMessages([]);
    //setShowOnboarding(true);
    addBuddyMessage("Session ended. Feel free to start a new conversation anytime!", 'happy');
  };

  const BuddyAvatar = ({ mood }) => {
    const currentMood = moodStates[mood] || moodStates.happy;
    const avatarStyle = {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      background: currentMood.color,
      animation: currentMood.animation === 'none' ? 'none' : `${currentMood.animation} 2s infinite ease-in-out`
    };

    return (
      <div style={avatarStyle}>
        {currentMood.emoji}
      </div>
    );
  };

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  const currentMood = moodStates[message.mood] || moodStates.happy;

  // Convert timestamp to Date if it's a string
  const timestamp = typeof message.timestamp === 'string'
    ? new Date(message.timestamp)
    : message.timestamp;

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '15px',
      opacity: 0,
      animation: 'fadeIn 0.3s ease-in forwards',
      animationDelay: `${messages.indexOf(message) * 0.1}s`
    }}>
      <div style={{ maxWidth: '80%' }}>
        {!isUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '5px',
            marginLeft: '45px'
          }}>
            <BuddyAvatar mood={message.mood} />
            <div style={{
              display: 'flex',
              flexDirection: 'column'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDarkMode ? colors.lightBg : colors.darkBg
              }}>
                Buddy
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.6)` : `rgba(${hexToRgb(colors.darkBg)}, 0.6)`
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: currentMood.color,
                  marginRight: '4px'
                }}></span>
                {message.mood.charAt(0).toUpperCase() + message.mood.slice(1)}
              </div>
            </div>
          </div>
        )}
        <div style={{
          padding: '14px 20px',
          borderRadius: isUser ? '30px 30px 4px 30px' : '30px 30px 30px 4px',
          background: isUser
            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
            : isDarkMode
              ? `rgba(${hexToRgb(colors.darkCard)}, 0.8)`
              : `rgba(${hexToRgb(colors.lightCard)}, 0.9)`,
          color: isUser ? colors.lightBg : (isDarkMode ? colors.lightBg : colors.darkBg),
          marginLeft: isUser ? '45px' : '0',
          marginRight: isUser ? '0' : '45px',
          maxWidth: '80%',
          wordWrap: 'break-word'
        }}>
          <p style={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontWeight: isUser ? '500' : '400'
          }}>
            {message.text}
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '5px',
            fontSize: '11px',
            opacity: 0.7,
            color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.7)` : `rgba(${hexToRgb(colors.darkBg)}, 0.7)`
          }}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: isDarkMode
        ? `linear-gradient(135deg, ${colors.darkBg} 0%, ${colors.darkCard} 100%)`
        : `linear-gradient(135deg, ${colors.lightBg} 0%, #e2e8f0 100%)`,
      color: isDarkMode ? colors.lightBg : colors.darkBg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    appContainer: {
      display: 'flex',
      flex: 1,
      height: '100vh',
      overflow: 'hidden',
    },
    sidebar: {
      width: showSidebar ? '280px' : '70px',
      background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.9)` : `rgba(${hexToRgb(colors.lightCard)}, 0.9)`,
      backdropFilter: 'blur(10px)',
      borderRight: isDarkMode ? `1px solid rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `1px solid rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
      padding: '20px 10px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      height: '100vh',
    },
    sidebarCollapsed: {
      width: '70px',
      overflow: 'hidden'
    },
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 15px',
      margin: '5px 0',
      borderRadius: '12px',
      cursor: 'pointer',
      color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.8)` : `rgba(${hexToRgb(colors.darkBg)}, 0.8)`,
      transition: 'all 0.2s ease',
      background: activeView === 'chat' ? (isDarkMode ? `rgba(${hexToRgb(colors.primary)}, 0.2)` : `rgba(${hexToRgb(colors.primary)}, 0.1)`) : 'transparent',
      ':hover': {
        background: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `rgba(${hexToRgb(colors.darkBg)}, 0.05)`
      }
    },
    sidebarItemExpanded: {
      justifyContent: 'flex-start',
      gap: '12px'
    },
    sidebarItemCollapsed: {
      justifyContent: 'center'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100vh'
    },
    header: {
      padding: '15px 20px',
      background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.9)` : `rgba(${hexToRgb(colors.lightCard)}, 0.9)`,
      backdropFilter: 'blur(10px)',
      borderBottom: isDarkMode ? `1px solid rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `1px solid rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      width: '100%'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.5)` : `rgba(${hexToRgb(colors.lightCard)}, 0.5)`,
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 180px)',
      overflowX: 'hidden'
    },
    messagesContent: {
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '20px'
    },
    inputContainer: {
      padding: '20px',
      background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.9)` : `rgba(${hexToRgb(colors.lightCard)}, 0.9)`,
      backdropFilter: 'blur(10px)',
      borderTop: isDarkMode ? `1px solid rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `1px solid rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
      position: 'sticky',
      bottom: 0,
      zIndex: 10
    },
    input: {
      width: '100%',
      padding: '14px 20px',
      borderRadius: '30px',
      border: isDarkMode ? `1px solid rgba(${hexToRgb(colors.lightBg)}, 0.2)` : `1px solid rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
      background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.8)` : `rgba(${hexToRgb(colors.lightCard)}, 0.9)`,
      color: isDarkMode ? colors.lightBg : colors.darkBg,
      fontSize: '15px',
      outline: 'none',
      marginBottom: '10px',
      transition: 'all 0.2s ease'
    },
    button: {
      padding: '12px 20px',
      borderRadius: '30px',
      border: 'none',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      color: colors.lightBg,
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    settingsContainer: {
      maxWidth: '600px',
      margin: '0 auto',
      width: '100%',
      padding: '20px',
      background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.8)` : `rgba(${hexToRgb(colors.lightCard)}, 0.8)`,
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(8px)'
    },
    settingsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '15px',
      borderBottom: isDarkMode ? `1px solid rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `1px solid rgba(${hexToRgb(colors.darkBg)}, 0.1)`
    },
    settingsTitle: {
      fontSize: '22px',
      fontWeight: '700',
      margin: 0,
      color: isDarkMode ? colors.lightBg : colors.darkBg
    },
    settingsForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    formLabel: {
      fontSize: '15px',
      fontWeight: '600',
      color: isDarkMode ? colors.lightBg : colors.darkBg
    },
    formInput: {
      width: '92%', 
      padding: '12px 16px',
      borderRadius: '12px',
      border: isDarkMode ? `1px solid rgba(${hexToRgb(colors.lightBg)}, 0.2)` : `1px solid rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
      background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.7)` : `rgba(${hexToRgb(colors.lightCard)}, 0.7)`,
      color: isDarkMode ? colors.lightBg : colors.darkBg,
      fontSize: '15px',
      outline: 'none'
    },
    settingsActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '30px'
    },
    secondaryButton: {
      padding: '10px 20px',
      borderRadius: '30px',
      border: isDarkMode ? `1px solid rgba(${hexToRgb(colors.lightBg)}, 0.2)` : `1px solid rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
      background: 'transparent',
      color: isDarkMode ? colors.lightBg : colors.darkBg,
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    endSessionButton: {
      padding: '10px 20px',
      borderRadius: '30px',
      border: 'none',
      background: `rgba(${hexToRgb(colors.error)}, 0.2)`,
      color: colors.error,
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      marginLeft: 'auto',
      ':hover': {
        background: `rgba(${hexToRgb(colors.error)}, 0.3)`
      }
    }
  };

  // Restore session when component mounts
  useEffect(() => {
    if (sessionId) {
      restoreSession();
    }
  }, [sessionId]);

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
            40%, 43% { transform: translateY(-8px); }
            70% { transform: translateY(-4px); }
            90% { transform: translateY(-2px); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes float {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-20px) translateX(20px); }
            100% { transform: translateY(0) translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .bounce-dot:nth-child(1) { animation-delay: -0.32s; }
          .bounce-dot:nth-child(2) { animation-delay: -0.16s; }
          .bounce-dot:nth-child(3) { animation-delay: 0s; }
        `}
      </style>

      {showOnboarding ? (
        <BuddyOnboarding
          onSubmit={handleOnboardingSubmit}
          isDarkMode={isDarkMode}
        />
      ) : (
        <div style={styles.appContainer}>
          {/* Sidebar */}
          <div style={{
            ...styles.sidebar,
            ...(showSidebar ? {} : styles.sidebarCollapsed)
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: showSidebar ? 'space-between' : 'center',
                alignItems: 'center',
                marginBottom: '30px',
                padding: '0 10px'
              }}>
                {showSidebar && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <BuddyAvatar mood={buddyMood} />
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      margin: 0,
                      color: isDarkMode ? colors.lightBg : colors.darkBg
                    }}>
                      Buddy
                    </h2>
                  </div>
                )}
                <button
                  onClick={toggleSidebar}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.8)` : `rgba(${hexToRgb(colors.darkBg)}, 0.8)`,
                    padding: '8px',
                    borderRadius: '8px',
                    ':hover': {
                      background: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `rgba(${hexToRgb(colors.darkBg)}, 0.05)`
                    }
                  }}
                >
                  {showSidebar ? <ChevronLeft size={18} /> : <User size={18} />}
                </button>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flex: 1,
                overflowY: 'auto',
                padding: '0 10px'
              }}>
                <button
                  onClick={handleBackToChat}
                  style={{
                    ...styles.sidebarItem,
                    ...(showSidebar ? styles.sidebarItemExpanded : styles.sidebarItemCollapsed),
                    background: activeView === 'chat' ? (isDarkMode ? `rgba(${hexToRgb(colors.primary)}, 0.2)` : `rgba(${hexToRgb(colors.primary)}, 0.1)`) : 'transparent'
                  }}
                >
                  <MessageSquare size={18} />
                  {showSidebar && <span>Chat</span>}
                </button>

                <button
                  onClick={handleSettingsClick}
                  style={{
                    ...styles.sidebarItem,
                    ...(showSidebar ? styles.sidebarItemExpanded : styles.sidebarItemCollapsed),
                    background: activeView === 'settings' ? (isDarkMode ? `rgba(${hexToRgb(colors.primary)}, 0.2)` : `rgba(${hexToRgb(colors.primary)}, 0.1)`) : 'transparent'
                  }}
                >
                  <Settings size={18} />
                  {showSidebar && <span>Settings</span>}
                </button>
              </div>

              <div style={{
                padding: '0 10px',
                marginTop: 'auto'
              }}>
                <div style={{
                  ...styles.sidebarItem,
                  ...(showSidebar ? styles.sidebarItemExpanded : styles.sidebarItemCollapsed),
                  marginTop: '20px'
                }}>
                  <HelpCircle size={18} />
                  {showSidebar && <span>Help</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerContent}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {activeView === 'settings' && (
                    <button
                      onClick={handleBackToChat}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.8)` : `rgba(${hexToRgb(colors.darkBg)}, 0.8)`,
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <div>
                    <h1 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      margin: 0,
                      color: isDarkMode ? colors.lightBg : colors.darkBg
                    }}>
                      {activeView === 'chat' ? 'Buddy' : 'Settings'}
                    </h1>
                    <p style={{
                      fontSize: '13px',
                      opacity: 0.7,
                      margin: 0,
                      color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.7)` : `rgba(${hexToRgb(colors.darkBg)}, 0.7)`
                    }}>
                      {activeView === 'chat' ? 'Your virtual friend' : 'Customize your experience'}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: isConnected ? `rgba(${hexToRgb(colors.success)}, 0.2)` : `rgba(${hexToRgb(colors.error)}, 0.2)`,
                    color: isConnected ? colors.success : colors.error
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isConnected ? colors.success : colors.error,
                      marginRight: '4px'
                    }}></div>
                    {isConnected ? 'Online' : 'Offline'}
                  </div>

                  <button
                    onClick={toggleTheme}
                    style={{
                      padding: '8px',
                      borderRadius: '50%',
                      background: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: 'none',
                      cursor: 'pointer',
                      color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.8)` : `rgba(${hexToRgb(colors.darkBg)}, 0.8)`
                    }}
                    aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Settings View */}
            {activeView === 'settings' && (
              <div style={{
                ...styles.messagesContainer,
                padding: '30px 20px',
                overflowY: 'auto'
              }}>
                <div style={styles.settingsContainer}>
                  <div style={styles.settingsHeader}>
                    <h2 style={styles.settingsTitle}>Your Profile</h2>
                  </div>

                  <div style={styles.settingsForm}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Your Name</label>
                      <input
                        type="text"
                        value={tempProfile.name}
                        onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                        style={styles.formInput}
                        placeholder="Your name or nickname"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Your Interests</label>
                      <input
                        type="text"
                        value={tempProfile.hobbies}
                        onChange={(e) => setTempProfile({...tempProfile, hobbies: e.target.value})}
                        style={styles.formInput}
                        placeholder="Gaming, music, sports, cooking..."
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Your Favorites</label>
                      <input
                        type="text"
                        value={tempProfile.favorites}
                        onChange={(e) => setTempProfile({...tempProfile, favorites: e.target.value})}
                        style={styles.formInput}
                        placeholder="Movies, music, books, foods, etc."
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Additional Info</label>
                      <textarea
                        value={tempProfile.additionalInfo || ''}
                        onChange={(e) => setTempProfile({...tempProfile, additionalInfo: e.target.value})}
                        style={{
                          ...styles.formInput,
                          minHeight: '100px',
                          resize: 'vertical',
                          padding: '12px 16px'
                        }}
                        placeholder="Tell me more about yourself..."
                      />
                    </div>
                  </div>

                  <div style={styles.settingsActions}>
                    <button
                      onClick={handleCancelSettings}
                      style={styles.secondaryButton}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      style={styles.button}
                    >
                      <Check size={16} style={{ marginRight: '6px' }} />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat View */}
            {activeView === 'chat' && (
              <>
                {/* Messages Container */}
                <div
                  ref={messagesContainerRef}
                  style={{
                    ...styles.messagesContainer,
                    overflowY: 'auto',
                    height: 'calc(100vh - 180px)'
                  }}
                >
                  <div style={styles.messagesContent}>
                    {messages.length === 0 && !isTyping && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        padding: '40px',
                        opacity: 0.7
                      }}>
                        <div style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                        }}>
                          <MessageSquare size={48} color={colors.lightBg} />
                        </div>
                        <h2 style={{
                          fontSize: '22px',
                          fontWeight: '700',
                          marginBottom: '10px',
                          color: isDarkMode ? colors.lightBg : colors.darkBg
                        }}>
                          Welcome to Buddy Chat!
                        </h2>
                        <p style={{
                          fontSize: '15px',
                          maxWidth: '400px',
                          marginBottom: '30px',
                          color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.8)` : `rgba(${hexToRgb(colors.darkBg)}, 0.8)`
                        }}>
                          Start a conversation with your virtual friend. Ask questions, share thoughts, or just chat about your day!
                        </p>
                        <button
                          onClick={getRandomPrompt}
                          style={{
                            ...styles.button,
                            padding: '12px 24px',
                            fontSize: '15px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <Zap size={16} style={{ marginRight: '8px' }} />
                          Suggest a topic
                        </button>
                      </div>
                    )}

                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}

                    {isTyping && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginBottom: '15px',
                        opacity: 0,
                        animation: 'fadeIn 0.3s ease-in forwards'
                      }}>
                        <div style={{ maxWidth: '75%' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '5px',
                            marginLeft: '45px'
                          }}>
                            <BuddyAvatar mood="thinking" />
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column'
                            }}>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: isDarkMode ? colors.lightBg : colors.darkBg
                              }}>
                                Buddy
                              </span>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                color: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.6)` : `rgba(${hexToRgb(colors.darkBg)}, 0.6)`
                              }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: moodStates.thinking.color,
                                  marginRight: '4px'
                                }}></span>
                                Thinking...
                              </div>
                            </div>
                          </div>
                          <div style={{
                            ...styles.messagesBubble,
                            background: isDarkMode ? `rgba(${hexToRgb(colors.darkCard)}, 0.8)` : `rgba(${hexToRgb(colors.lightCard)}, 0.9)`,
                            marginRight: '20px',
                            marginLeft: '45px',
                            borderBottomRightRadius: '22px',
                            borderBottomLeftRadius: '4px'
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: '4px',
                              padding: '10px 14px',
                              alignItems: 'center'
                            }}>
                              <div className="bounce-dot" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.6)` : `rgba(${hexToRgb(colors.darkBg)}, 0.6)`,
                                animationName: 'bounce',
                                animationDuration: '1.4s',
                                animationIterationCount: 'infinite',
                                animationFillMode: 'both'
                              }}></div>
                              <div className="bounce-dot" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.6)` : `rgba(${hexToRgb(colors.darkBg)}, 0.6)`,
                                animationName: 'bounce',
                                animationDuration: '1.4s',
                                animationIterationCount: 'infinite',
                                animationFillMode: 'both',
                                animationDelay: '0.16s'
                              }}></div>
                              <div className="bounce-dot" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.6)` : `rgba(${hexToRgb(colors.darkBg)}, 0.6)`,
                                animationName: 'bounce',
                                animationDuration: '1.4s',
                                animationIterationCount: 'infinite',
                                animationFillMode: 'both',
                                animationDelay: '0.32s'
                              }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Container */}
                <div style={styles.inputContainer}>
                  <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={getRandomPrompt}
                        style={{
                          ...styles.button,
                          background: isDarkMode ? `rgba(${hexToRgb(colors.lightBg)}, 0.1)` : `rgba(${hexToRgb(colors.darkBg)}, 0.1)`,
                          color: isDarkMode ? colors.lightBg : colors.darkBg,
                          fontSize: '14px',
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Zap size={16} style={{ marginRight: '6px' }} />
                        Suggest a topic
                      </button>

                      <button
                        onClick={handleEndSession}
                        style={styles.endSessionButton}
                      >
                        End Session
                      </button>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        style={{
                          ...styles.input,
                          flex: 1,
                          marginBottom: 0,
                          padding: '14px 20px',
                          fontSize: '15px'
                        }}
                        disabled={isTyping}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isTyping || !inputMessage.trim()}
                        style={{
                          ...styles.button,
                          padding: '14px',
                          borderRadius: '50%',
                          width: '50px',
                          height: '50px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          opacity: (isTyping || !inputMessage.trim()) ? 0.5 : 1,
                          cursor: (isTyping || !inputMessage.trim()) ? 'not-allowed' : 'pointer'
                        }}
                        aria-label="Send message"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuddyChat;