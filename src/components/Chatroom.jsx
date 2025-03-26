import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './Chatroom.css';
import Nav from './db/Nav';

const Chatroom = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const navigate = useNavigate();
  
  const userEmail = localStorage.getItem('email');
  const userName = localStorage.getItem('name');
  const token = localStorage.getItem('token');
  
  // Initialize socket connection
  useEffect(() => {
    if (!token || !userEmail) return;
    
    // Connect to socket server
    socketRef.current = io(`${import.meta.env.VITE_API_URL}`);
    
    // Join user's room
    socketRef.current.emit('join', userEmail);
    
    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      console.log("Received new message:", message);
      
      // Only add the message if it's from the currently selected friend
      if (selectedFriend && 
         ((message.isFromUser && message.receiverEmail === selectedFriend.email) || 
          (!message.isFromUser && message.senderEmail === selectedFriend.email))) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });
    
    // Listen for errors
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userEmail, token, selectedFriend]);
  
  // Fetch friends list
  useEffect(() => {
    if (!token || !userEmail) return;
    
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/${userEmail}`);
        setFriends(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching friends:', error);
        setLoading(false);
      }
    };
    
    fetchFriends();
  }, [userEmail, token]);
  
  // Fetch chat history when a friend is selected
  useEffect(() => {
    if (selectedFriend && userEmail && token) {
      fetchChatHistory();
    }
  }, [selectedFriend]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const fetchChatHistory = async () => {
    if (!selectedFriend || !userEmail || !token) return;
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/chat-history`, {
        params: {
          userEmail,
          friendEmail: selectedFriend.email
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !userEmail || !socketRef.current) return;
    
    console.log("Sending message:", {
      senderEmail: userEmail,
      receiverEmail: selectedFriend.email,
      content: newMessage
    });
    
    // Send message via socket
    socketRef.current.emit('sendMessage', {
      senderEmail: userEmail,
      receiverEmail: selectedFriend.email,
      content: newMessage
    });
    
    // Clear input field (the actual message will be added to the UI when the socket sends it back)
    setNewMessage('');
  };
  
  const selectFriend = (friend) => {
    setSelectedFriend(friend);
    setMessages([]);
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <>
    <Nav/>
    <div className="pt-10 chatroom-container">
      <div className="friends-sidebar">
        <h2>Friends</h2>
        {friends.length === 0 ? (
          <p>No friends yet. Add some friends to chat!</p>
        ) : (
          <ul className="friends-list">
            {friends.map(friend => (
              <li 
                key={friend._id} 
                className={selectedFriend && selectedFriend._id === friend._id ? 'selected' : ''}
                onClick={() => selectFriend(friend)}
              >
                <div className="friend-item">
                  {friend.profilePicture ? (
                    <img 
                      src={`data:image/jpeg;base64,${friend.profilePicture}`} 
                      alt={friend.name} 
                      className="friend-avatar"
                    />
                  ) : (
                    <div className="default-avatar">{friend.name.charAt(0)}</div>
                  )}
                  <span>{friend.name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="chat-area">
        {selectedFriend ? (
          <>
            <div className="chat-header">
              <h3>Chat with {selectedFriend.name}</h3>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <p className="no-messages">No messages yet. Start the conversation!</p>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg._id} 
                    className={`message ${msg.isFromUser ? 'user-message' : 'friend-message'}`}
                  >
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="message-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </>
        ) : (
          <div className="select-friend-prompt">
            <p>Select a friend to start chatting</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Chatroom;
