import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { useUser } from '../context/UserContext';
import { useEmployee } from '../context/EmployeeContext';

const Chat = ({ isOpen, onClose, socket, messages, setMessages, onlineUsers, wishTarget, wishMessage, setWishMessage }) => {
  const { user } = useUser();

  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  // When a wishTarget is passed in, auto-select that user
  useEffect(() => {
    if (isOpen && wishTarget) {
      setSelectedUser(wishTarget);
    }
  }, [isOpen, wishTarget]);

  // When a wishMessage is received, pre-fill it in the input area
  useEffect(() => {
    if (isOpen && wishMessage) {
      setInputMessage(wishMessage);
      // Clear the wish from parent so it doesn't keep replacing the input
      if (setWishMessage) setWishMessage('');
    }
  }, [isOpen, wishMessage, setWishMessage]);

  // Fetch all chat users when the chat logic opens
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const res = await fetch(`${API_URL}/users`);
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

  // Fetch chat history only when selectedUser changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser && user && isOpen) {
        try {
          const currentUserId = user.employeeId || user.id;
          const res = await fetch(`${API_URL}/messages/${currentUserId}/${selectedUser.id}`);
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
    }
  };

  if (!isOpen) return null;

  const currentUserId = user ? (user.employeeId || user.id) : null;
  const chatableUsers = chatUsers.filter(emp =>
    emp.id !== currentUserId && (emp.role === 'admin' || emp.role === 'superadmin')
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.chatContainer}>
        {/* Chat Sidebar / User List */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>Chats</h3>
            <button onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
          <div style={styles.userList}>
            {chatableUsers.length === 0 ? (
              <p style={{ color: '#6b7b6b', textAlign: 'center', marginTop: 20 }}>No users available</p>
            ) : (
              chatableUsers.map(emp => {
                const isOnline = onlineUsers.includes(emp.id);
                const isSelected = selectedUser?.id === emp.id;
                return (
                  <div
                    key={emp.id}
                    style={{
                      ...styles.userItem,
                      backgroundColor: isSelected ? 'rgba(118,199,51,0.1)' : 'transparent',
                      borderColor: isSelected ? '#76c733' : 'transparent',
                    }}
                    onClick={() => setSelectedUser(emp)}
                  >
                    <div style={styles.avatar}>
                      {emp.initials}
                      {isOnline && <div style={styles.onlineDot} />}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{emp.name}</div>
                      <div style={{ color: '#6b7b6b', fontSize: '12px' }}>{emp.role}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {selectedUser ? (
            <>
              <div style={styles.chatHeader}>
                <div style={styles.avatarSmall}>{selectedUser.initials}</div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{selectedUser.name}</div>
                  <div style={{ color: '#76c733', fontSize: '12px' }}>
                    {onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              <div style={styles.messagesContainer}>
                {(() => {
                  const filteredMessages = messages.filter(
                    (msg) =>
                      (msg.senderId === currentUserId && msg.receiverId === selectedUser.id) ||
                      (msg.senderId === selectedUser.id && msg.receiverId === currentUserId)
                  );
                  return filteredMessages.length === 0 ? (
                    <p style={{ color: '#6b7b6b', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                      Send a message to start conversing with {selectedUser.name}.
                    </p>
                  ) : (
                    filteredMessages.map((msg, idx) => {
                      const isMine = msg.senderId === currentUserId;
                      return (
                        <div key={msg._id || idx} style={{
                          ...styles.messageWrapper,
                          justifyContent: isMine ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            ...styles.messageBubble,
                            backgroundColor: isMine ? '#76c733' : '#1a2a1a',
                            color: isMine ? '#0e1510' : '#d0e0d0',
                            borderBottomRightRadius: isMine ? 0 : 16,
                            borderBottomLeftRadius: !isMine ? 0 : 16,
                          }}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  );
                })()}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} style={styles.inputArea}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  style={styles.input}
                />
                <button type="submit" style={styles.sendBtn} disabled={!inputMessage.trim()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <h3 style={{ color: '#fff', margin: 0 }}>Your Messages</h3>
              <p style={{ color: '#6b7b6b', marginTop: '8px' }}>Select a user from the list to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  chatContainer: {
    width: '850px', height: '600px',
    backgroundColor: '#0e1510',
    border: '1px solid #1a2a1a',
    borderRadius: '24px',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: '280px',
    borderRight: '1px solid #1a2a1a',
    display: 'flex', flexDirection: 'column',
    backgroundColor: '#0a100a',
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid #1a2a1a',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#6b7b6b', fontSize: '18px',
    cursor: 'pointer', padding: '4px',
  },
  userList: {
    flex: 1, overflowY: 'auto',
    padding: '12px',
  },
  userItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px', borderRadius: '12px',
    cursor: 'pointer', transition: 'all 0.2s',
    border: '1px solid transparent',
  },
  avatar: {
    width: '40px', height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(118,199,51,0.15)',
    color: '#76c733', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', flexShrink: 0,
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: '10px', height: '10px',
    backgroundColor: '#76c733', borderRadius: '50%',
    border: '2px solid #0a100a',
  },
  chatArea: {
    flex: 1, display: 'flex', flexDirection: 'column',
    position: 'relative', backgroundColor: '#0e1510',
  },
  chatHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #1a2a1a',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  avatarSmall: {
    width: '36px', height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(118,199,51,0.15)',
    color: '#76c733', fontWeight: 700, fontSize: '13px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1, overflowY: 'auto',
    padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  messageWrapper: {
    display: 'flex', width: '100%',
  },
  messageBubble: {
    maxWidth: '70%', padding: '12px 16px',
    borderRadius: '16px', fontSize: '14px',
    lineHeight: '1.5',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  inputArea: {
    padding: '20px 24px',
    borderTop: '1px solid #1a2a1a',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  input: {
    flex: 1, backgroundColor: '#1a2a1a',
    border: '1px solid #2a3a2a', borderRadius: '24px',
    padding: '12px 20px', color: '#d0e0d0',
    outline: 'none', fontSize: '14px',
  },
  sendBtn: {
    backgroundColor: '#76c733', color: '#0e1510',
    border: 'none', borderRadius: '50%',
    width: '44px', height: '44px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'background-color 0.2s',
  },
  emptyState: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  }
};

export default Chat;
