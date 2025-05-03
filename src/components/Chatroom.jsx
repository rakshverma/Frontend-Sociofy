import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Nav from './db/Nav';

const Chatroom = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    
    // Close sidebar on mobile after selecting a friend
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Nav />
      
      <div className="flex flex-1 pt-16 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button 
          className="md:hidden fixed bottom-4 right-4 z-20 bg-blue-600 text-white rounded-full p-3 shadow-lg"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        
        {/* Friends sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transform transition-transform duration-300 ease-in-out w-full md:w-1/4 lg:w-1/5 bg-white border-r border-gray-200 fixed md:static inset-0 z-10 h-full overflow-y-auto`}>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Friends</h2>
          </div>
          
          {friends.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No friends yet. Add some friends to chat!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {friends.map(friend => (
                <li 
                  key={friend._id} 
                  className={`cursor-pointer transition-colors ${selectedFriend && selectedFriend._id === friend._id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => selectFriend(friend)}
                >
                  <div className="flex items-center p-4 space-x-3">
                    {friend.profilePicture ? (
                      <img 
                        src={`data:image/jpeg;base64,${friend.profilePicture}`} 
                        alt={friend.name} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-800">{friend.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col h-full md:ml-0 ml-0">
          {selectedFriend ? (
            <>
              <div className="border-b border-gray-200 p-4 bg-white shadow-sm">
                <div className="flex items-center space-x-3">
                  {selectedFriend.profilePicture ? (
                    <img 
                      src={`data:image/jpeg;base64,${selectedFriend.profilePicture}`} 
                      alt={selectedFriend.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                      {selectedFriend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-800">{selectedFriend.name}</h3>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => (
                      <div 
                        key={msg._id} 
                        className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                            msg.isFromUser 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <div className="break-words">{msg.content}</div>
                          <div className={`text-xs mt-1 ${msg.isFromUser ? 'text-blue-200' : 'text-gray-500'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    type="submit" 
                    className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-xl font-medium text-gray-800">Select a friend to start chatting</p>
                <p className="text-gray-500 mt-2">Choose from your friends list to begin a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatroom;
