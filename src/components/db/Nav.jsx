import { useState, useRef, useEffect } from 'react';
import { FaHome, FaUserCircle, FaCog, FaEnvelope, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

function Nav() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const userEmail = localStorage.getItem("email");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log("Storage cleared!");
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        if (!userEmail) return;

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/friend-requests/${userEmail}`);
        console.log("Friend requests response:", response.data);
        
        // Ensure each request has a valid _id
        const validRequests = response.data.filter(req => req.requestId && req.sender);
        if (validRequests.length !== response.data.length) {
          console.warn("Some friend requests are missing required fields:", 
            response.data.filter(req => !req.requestId || !req.sender));
        }
        
        setFriendRequests(validRequests);
        setNotificationCount(validRequests.length);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    if (userEmail) {
      fetchFriendRequests();
      
      // Set up interval to check for new requests every minute
      const interval = setInterval(fetchFriendRequests, 60000);
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/search-users?query=${query}&email=${userEmail}`);
        setSearchResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    } else {
      setShowDropdown(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?query=${searchQuery}`);
      setShowDropdown(false);
    }
  };

  const handleUserClick = (userEmail) => {
    navigate(`/user-profile/${userEmail}`);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      console.log("Accepting friend request with ID:", requestId);

      if (!requestId) {
        throw new Error("Request ID is missing or undefined");
      }
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/accept-friend-request/${requestId}`, {
        email: userEmail
      });
      
      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request.requestId !== requestId)
      );
      
      setNotificationCount(prev => prev - 1);
      
      alert("Friend request accepted successfully!");
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert("Failed to accept friend request: " + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/reject-friend-request/${
