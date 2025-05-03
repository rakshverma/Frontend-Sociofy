import { useState, useRef, useEffect } from 'react';
import { FaHome, FaUserCircle, FaCog, FaEnvelope, FaBell, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userEmail = localStorage.getItem("email");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);

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

    if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
      setMobileMenuOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  // Fetch friend requests when component mounts
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        if (!userEmail) return;

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/friend-requests/${userEmail}`);
        console.log("Friend requests response:", response.data);
        
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
      setMobileMenuOpen(false);
    }
  };

  const handleUserClick = (userEmail) => {
    navigate(`/user-profile/${userEmail}`);
    setShowDropdown(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setShowDropdown(false);
    setShowNotifications(false);
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
      await axios.post(`${import.meta.env.VITE_API_URL}/reject-friend-request/${requestId}`, {
        email: userEmail
      });

      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request.requestId !== requestId)
      );
      setNotificationCount(prev => prev - 1);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert("Failed to reject friend request. Please try again.");
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm px-4 py-2 flex items-center justify-between fixed w-full z-50 top-0">
        {/* Logo/Brand and Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          <button 
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <FaTimes className="h-5 w-5" />
            ) : (
              <FaBars className="h-5 w-5" />
            )}
          </button>
          
          <Link 
            to={userEmail ? `/dashboard/${userEmail}` : "/"} 
            className="font-bold text-blue-600 text-lg hover:text-blue-700 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sociofy
          </Link>
        </div>

        {/* Desktop Search - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-xs mx-4">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <IoSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-full text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Search people..."
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              />
            </div>
            
            {showDropdown && searchResults.length > 0 && (
              <div 
                ref={dropdownRef}
                className="absolute mt-1 w-full max-w-xs bg-white rounded-lg shadow-lg py-1 z-10 max-h-80 overflow-auto border border-gray-200"
              >
                {searchResults.slice(0, 5).map((user) => (
                  <div 
                    key={user._id} 
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center transition-colors"
                    onClick={() => handleUserClick(user.email)}
                  >
                    {user.profilePicture ? (
                      <img 
                        src={`data:image/jpeg;base64,${user.profilePicture}`} 
                        alt={user.name} 
                        className="h-8 w-8 rounded-full object-cover mr-2 border border-gray-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                        <FaUserCircle className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
                {searchResults.length > 5 && (
                  <div 
                    className="px-3 py-2 text-center text-blue-600 text-sm font-medium border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={handleSearchSubmit}
                  >
                    See all results
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
        
        {/* Desktop Navigation Icons - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-5">
          <Link 
            to={userEmail ? `/dashboard/${userEmail}` : "/"} 
            className="text-gray-700 hover:text-blue-600 transition-colors p-1"
            title="Home"
          >
            <FaHome className="h-5 w-5" />
          </Link>
          
          <Link 
            to="/chatroom" 
            className="text-gray-700 hover:text-blue-600 transition-colors p-1"
            title="Messages"
          >
            <FaEnvelope className="h-5 w-5" />
          </Link>
          
          <div className="relative" ref={notificationRef}>
            <button 
              className="text-gray-700 hover:text-blue-600 transition-colors p-1 relative"
              onClick={toggleNotifications}
              title="Notifications"
            >
              <FaBell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200">
                <div className="px-3 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                </div>
                
                {friendRequests.length === 0 ? (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {friendRequests.map(request => (
                      <div key={request.requestId} className="px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          {request.sender.profilePicture ? (
                            <img 
                              src={`data:image/jpeg;base64,${request.sender.profilePicture}`} 
                              alt={request.sender.name} 
                              className="h-8 w-8 rounded-full object-cover mr-2 border border-gray-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <FaUser className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-900">
                              <span className="font-semibold">{request.sender.name}</span> sent you a friend request
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-end space-x-2">
                          <button 
                            onClick={() => handleAcceptFriendRequest(request.requestId)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleRejectFriendRequest(request.requestId)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300 transition-colors flex items-center"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Link 
            to={`/dashboard/profile/${userEmail}`} 
            className="text-gray-700 hover:text-blue-600 transition-colors p-1"
            title="Profile"
          >
            <FaUserCircle className="h-5 w-5" />
          </Link>

          <Link 
            to={`/settings/${userEmail}`} 
            className="text-gray-700 hover:text-blue-600 transition-colors p-1"
            title="Settings"
          >
            <FaCog className="h-5 w-5" />
          </Link>

          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 transition-colors p-1 ml-2"
            title="Logout"
          >
            <FaSignOutAlt className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Search Button - Visible only on mobile */}
        <button 
          className="md:hidden text-gray-700 p-1"
          onClick={() => {
            setMobileMenuOpen(false);
            document.getElementById('mobile-search-input')?.focus();
          }}
        >
          <IoSearch className="h-5 w-5" />
        </button>
      </nav>

      {/* Mobile Menu - Slides in from left */}
      <div 
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ marginTop: '56px' }} // Adjust based on your nav height
      >
        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <IoSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="mobile-search-input"
                type="text"
                className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-full text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search people..."
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              />
            </div>
          </form>
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute left-0 right-0 mx-4 bg-white rounded-lg shadow-lg py-1 z-10 max-h-80 overflow-auto border border-gray-200"
          >
            {searchResults.slice(0, 5).map((user) => (
              <div 
                key={user._id} 
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleUserClick(user.email)}
              >
                {user.profilePicture ? (
                  <img 
                    src={`data:image/jpeg;base64,${user.profilePicture}`} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full object-cover mr-2 border border-gray-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    <FaUserCircle className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-2">
          <Link 
            to={userEmail ? `/dashboard/${userEmail}` : "/"} 
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaHome className="h-5 w-5 mr-3" />
            <span>Home</span>
          </Link>
          
          <Link 
            to="/chatroom" 
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaEnvelope className="h-5 w-5 mr-3" />
            <span>Messages</span>
          </Link>
          
          <button 
            className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors relative"
            onClick={toggleNotifications}
          >
            <FaBell className="h-5 w-5 mr-3" />
            <span>Notifications</span>
            {notificationCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {notificationCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="ml-8 mt-1 mb-2 bg-gray-50 rounded-md p-2 border border-gray-200">
              {friendRequests.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-2">
                  No new notifications
                </div>
              ) : (
                <div className="space-y-2">
                  {friendRequests.map(request => (
                    <div key={request.requestId} className="p-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        {request.sender.profilePicture ? (
                          <img 
                            src={`data:image/jpeg;base64,${request.sender.profilePicture}`} 
                            alt={request.sender.name} 
                            className="h-6 w-6 rounded-full object-cover mr-2 border border-gray-200"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <FaUser className="h-3 w-3 text-gray-500" />
                          </div>
                        )}
                        <div className="text-xs">
                          <p className="font-medium text-gray-900">
                            {request.sender.name} sent a friend request
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-end space-x-1">
                        <button 
                          onClick={() => handleAcceptFriendRequest(request.requestId)}
                          className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRejectFriendRequest(request.requestId)}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <Link 
            to={`/dashboard/profile/${userEmail}`} 
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaUserCircle className="h-5 w-5 mr-3" />
            <span>Profile</span>
          </Link>
          
          <Link 
            to={`/settings/${userEmail}`} 
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FaCog className="h-5 w-5 mr-3" />
            <span>Settings</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-red-500 hover:bg-gray-100 rounded-md transition-colors mt-2"
          >
            <FaSignOutAlt className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay when mobile menu is open */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
          style={{ marginTop: '56px' }} // Adjust based on your nav height
        />
      )}
    </>
  );
}

export default Nav;
