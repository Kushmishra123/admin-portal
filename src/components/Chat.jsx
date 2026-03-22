import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { useUser } from '../context/UserContext';
import '../styles/chat.css';

const Chat = ({ isOpen, onClose, socket, messages, setMessages, onlineUsers, wishTarget, wishMessage, setWishMessage }) => {
  const { user } = useUser();

  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [drafts, setDrafts] = useState({});
  const messagesEndRef = useRef(null);

  // When a wishTarget is passed in, auto-select that user
  useEffect(() => {
    if (isOpen && wishTarget) {
      setSelectedUser(wishTarget);
    }
  }, [isOpen, wishTarget]);

  // When a wishMessage is received, pre-fill it in the input area for the specific target
  useEffect(() => {
    if (isOpen && wishMessage && wishTarget) {
      setDrafts(prev => ({ ...prev, [wishTarget.id]: wishMessage }));
      if (setWishMessage) setWishMessage('');
    }
  }, [isOpen, wishMessage, wishTarget, setWishMessage]);

  // When selected user changes, restore their draft message
  useEffect(() => {
    if (selectedUser) {
      setInputMessage(drafts[selectedUser.id] || '');
    }
  }, [selectedUser, drafts]);

  // Fetch all chat users when the chat opens
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const res = await fetch(`${API_URL}/users`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setChatUsers(data);
          }
        } catch (error) {
          console.error('Failed to fetch chat users:', error);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  // Fetch chat history when selectedUser changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser && user && isOpen) {
        try {
          const currentUserId = user.employeeId || user.id;
          const res = await fetch(`${API_URL}/messages/${currentUserId}/${selectedUser.id}`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
          }
        } catch (error) {
          console.error('Failed to fetch messages:', error);
        }
      }
    };
    fetchMessages();
  }, [selectedUser, user, setMessages, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket && selectedUser && user) {
      const msgData = {
        senderId: user.employeeId || user.id,
        receiverId: selectedUser.id,
        text: inputMessage,
      };

      // Optimistically add the message to the UI immediately
      const optimisticMsg = {
        ...msgData,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      socket.emit('sendMessage', msgData);
      setInputMessage('');
      setDrafts(prev => ({ ...prev, [selectedUser.id]: '' }));
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const confirmDeleteChat = async () => {
    if (!selectedUser || !user) return;

    try {
      const currentUserId = user.employeeId || user.id;
      const res = await fetch(`${API_URL}/messages/${currentUserId}/${selectedUser.id}?requesterId=${currentUserId}&requesterRole=${user.role}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setMessages((prev) => prev.filter(
          (msg) => 
            !(msg.senderId === currentUserId && msg.receiverId === selectedUser.id) &&
            !(msg.senderId === selectedUser.id && msg.receiverId === currentUserId)
        ));
        setShowDeleteConfirm(false); // Close the modal
      } else {
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('An error occurred while deleting the message');
    }
  };

  const handleDeleteChat = () => {
    if (!selectedUser || !user) return;
    
    const currentUserId = user.employeeId || user.id;
    const hasMessages = messages.some(
      (msg) =>
        (msg.senderId === currentUserId && msg.receiverId === selectedUser.id) ||
        (msg.senderId === selectedUser.id && msg.receiverId === currentUserId)
    );

    if (!hasMessages) {
      alert('No messages found or messages are already deleted.');
      return;
    }

    setShowDeleteConfirm(true);
  };
  if (!isOpen) return null;

  const currentUserId = user ? (user.employeeId || user.id) : null;
  const chatableUsers = chatUsers.filter(emp =>
    emp.id !== currentUserId && (emp.role === 'admin' || emp.role === 'superadmin')
  );

  return (
    <div className="chat-overlay">
      <div className="chat-container">

        {/* ── Users Sidebar ── */}
        <div className={`chat-sidebar ${selectedUser ? 'hidden-on-mobile' : ''}`}>
          <div className="chat-sidebar-header">
            <h3 className="chat-sidebar-title">Chats</h3>
            <button onClick={onClose} className="chat-close-btn" title="Close chat">✕</button>
          </div>

          <div className="chat-user-list">
            {chatableUsers.length === 0 ? (
              <p className="chat-no-users">No users available</p>
            ) : (
              chatableUsers.map(emp => {
                const isOnline = onlineUsers.includes(emp.id);
                const isSelected = selectedUser?.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    className="chat-user-item"
                    style={{
                      backgroundColor: isSelected ? 'rgba(118,199,51,0.1)' : 'transparent',
                      borderColor: isSelected ? '#76c733' : 'transparent',
                    }}
                    onClick={() => setSelectedUser(emp)}
                  >
                    <div className="chat-avatar">
                      {emp.initials}
                      {isOnline && <div className="chat-online-dot" />}
                    </div>
                    <div>
                      <div className="chat-user-name">{emp.name}</div>
                      <div className="chat-user-role">{emp.role}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div className={`chat-area ${!selectedUser ? 'hidden-on-mobile' : ''}`}>
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="chat-header">
                {/* Back button — only visible on mobile */}
                <button
                  className="chat-back-btn"
                  onClick={() => setSelectedUser(null)}
                  title="Back to user list"
                >
                  ‹
                </button>
                <div className="chat-avatar-small">{selectedUser.initials}</div>
                <div>
                  <div className="chat-header-name">{selectedUser.name}</div>
                  <div className="chat-header-status">
                    {onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}
                  </div>
                </div>
                {/* Delete Chat Button */}
                <button
                  className="chat-delete-btn"
                  onClick={handleDeleteChat}
                  title="Delete Chat History"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {(() => {
                  const filteredMessages = messages.filter(
                    (msg) =>
                      (msg.senderId === currentUserId && msg.receiverId === selectedUser.id) ||
                      (msg.senderId === selectedUser.id && msg.receiverId === currentUserId)
                  );
                  return filteredMessages.length === 0 ? (
                    <p style={{ color: '#6b7b6b', textAlign: 'center', margin: 'auto' }}>
                      Send a message to start conversing with {selectedUser.name}.
                    </p>
                  ) : (
                    filteredMessages.map((msg, idx) => {
                      const isMine = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg._id || idx}
                          className="chat-message-wrapper"
                          style={{ justifyContent: isMine ? 'flex-end' : 'flex-start' }}
                        >
                          <div className={`chat-bubble ${isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  );
                })()}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="chat-input-area">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    if (selectedUser) {
                      setDrafts(prev => ({ ...prev, [selectedUser.id]: e.target.value }));
                    }
                  }}
                  placeholder="Type your message..."
                  className="chat-input"
                />
                <button type="submit" className="chat-send-btn" disabled={!inputMessage.trim()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            /* Empty state when no chat is selected — visible on desktop only */
            <div className="chat-empty-state">
              <div className="chat-empty-icon">💬</div>
              <h3 className="chat-empty-title">Your Messages</h3>
              <p className="chat-empty-subtitle">Select a user from the list to start chatting.</p>
            </div>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="chat-delete-modal-overlay">
          <div className="chat-delete-modal">
            <h3 className="chat-delete-modal-title">Delete Message</h3>
            <p className="chat-delete-modal-text">Are you sure you want to delete this message?</p>
            <div className="chat-delete-modal-actions">
              <button 
                className="chat-delete-btn-cancel" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="chat-delete-btn-confirm" 
                onClick={confirmDeleteChat}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
