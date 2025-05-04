import { useState, useRef, useEffect } from 'react';
import { FaHome, FaUserCircle, FaCog, FaEnvelope, FaBell, FaUser, FaSignOutAlt, FaBars, FaTimes, FaSearch } from 'react-icons/fa';
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  
  const userEmail = localStorage.getItem("email");
  const navigate = useNavigate();
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileNotificationRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target) &&
          mobileNotificationRef.current && !mobileNotificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
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
        const validRequests = response.data.filter(req => req.requestId && req.sender);
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
    
    if (query.length >= 1) {
      setIsSearching(true);
      setNoResults(false);
      
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/search-users?query=${query}&email=${userEmail}`);
        setSearchResults(response.data);
        setShowDropdown(true);
        setIsSearching(false);
        
        if (response.data.length === 0) {
          setNoResults(true);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setIsSearching(false);
        setNoResults(true);
      }
    } else {
      setShowDropdown(false);
      setNoResults(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    
    if (searchQuery.trim()) {
      navigate(`/search-results?query=${searchQuery}`);
      setShowDropdown(false);
      setMobileMenuOpen(false);
      setShowMobileSearch(false);
      setSearchQuery('');
    }
  };

  const handleUserClick = (userEmail) => {
    navigate(`/user-profile/${userEmail}`);
    setShowDropdown(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
    setShowMobileSearch(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setMobileMenuOpen(false);
    setShowMobileSearch(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setShowDropdown(false);
    setShowNotifications(false);
    setShowMobileSearch(false);
  };

  const handleMobileSearchClick = () => {
    setShowMobileSearch(true);
    setTimeout(() => {
      document.getElementById('mobile-search-input')?.focus();
    }, 100);
  };

  const handleAcceptFriendRequest = async (requestId, event) => {
    try {
      if (event) event.stopPropagation();
      
      await axios.post(`${import.meta.env.VITE_API_URL}/accept-friend-request/${requestId}`, {
        email: userEmail
      });
      
      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request.requestId !== requestId)
      );
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId, event) => {
    try {
      if (event) event.stopPropagation();
      
      await axios.post(`${import.meta.env.VITE_API_URL}/reject-friend-request/${requestId}`, {
        email: userEmail
      });
      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request.requestId !== requestId)
      );
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-md px-4 py-3 flex items-center justify-between fixed w-full z-50 top-0">
        <div className="flex items-center space-x-4">
          <button 
            className="md:hidden text-gray-700 focus:outline-none mobile-menu-button transition-transform hover:scale-110"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <FaTimes className="h-5 w-5 text-blue-600" />
            ) : (
              <FaBars className="h-5 w-5" />
            )}
          </button>
          
          <Link 
            to={userEmail ? `/dashboard/${userEmail}` : "/"}
            className="font-bold text-blue-600 text-lg hover:text-blue-700 transition-colors flex items-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="bg-blue-600 text-white rounded-lg px-2 py-1 mr-1">S</span>
            <span>ociofy</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Search people..."
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery.length >= 1 && setShowDropdown(true)}
              />
            </div>
            
            {showDropdown && (
              <div 
                ref={dropdownRef}
                className="absolute mt-1 w-full max-w-md bg-white rounded-lg shadow-lg py-1 z-10 max-h-80 overflow-auto border border-gray-200"
              >
                {isSearching && (
                  <div className="px-4 py-3 text-center text-gray-500">
                    <div className="animate-pulse">Searching...</div>
                  </div>
                )}
                
                {!isSearching && noResults && (
                  <div className="px-4 py-3 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
                
                {!isSearching && !noResults && searchResults.length > 0 && (
                  <>
                    {searchResults.slice(0, 5).map((user) => (
                      <div 
                        key={user._id}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center transition-colors"
                        onClick={() => handleUserClick(user.email)}
                      >
                        {user.profilePicture ? (
                          <img 
                            src={`data:image/jpeg;base64,${user.profilePicture}`}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shadow-sm">
                            <FaUserCircle className="h-6 w-6 text-blue-500" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    ))}
                    
                    {searchResults.length > 5 && (
                      <div 
                        className="px-4 py-2 text-center text-blue-600 text-sm font-medium border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={handleSearchSubmit}
                      >
                        See all results
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </div>
        
        <div className="hidden md:flex items-center space-x-5">
          <Link 
            to={userEmail ? `/dashboard/${userEmail}` : "/"}
            className="text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
            title="Home"
          >
            <FaHome className="h-5 w-5" />
          </Link>
          
          <Link 
            to="/chatroom"
            className="text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
            title="Messages"
          >
            <FaEnvelope className="h-5 w-5" />
          </Link>
          
          <div className="relative" ref={notificationRef}>
            <button 
              className="text-gray-700 hover:text-blue-600 transition-colors p-2 relative rounded-full hover:bg-blue-50"
              onClick={toggleNotifications}
              title="Notifications"
              aria-label="Notifications"
            >
              <FaBell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-sm">
                  {notificationCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-2 z-10 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                
                {friendRequests.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <FaBell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {friendRequests.map(request => (
                      <div key={request.requestId} className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          {request.sender.profilePicture ? (
                            <img 
                              src={`data:image/jpeg;base64,${request.sender.profilePicture}`}
                              alt={request.sender.name}
                              className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shadow-sm">
                              <FaUser className="h-5 w-5 text-blue-500" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              <span className="font-semibold">{request.sender.name}</span> sent you a friend request
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex justify-end space-x-2">
                          <button 
                            onClick={(e) => handleAcceptFriendRequest(request.requestId, e)}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={(e) => handleRejectFriendRequest(request.requestId, e)}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors shadow-sm flex items-center"
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
            className="text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
            title="Profile"
          >
            <FaUserCircle className="h-5 w-5" />
          </Link>
          <Link 
            to={`/settings/${userEmail}`}
            className="text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
            title="Settings"
          >
            <FaCog className="h-5 w-5" />
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50 ml-2"
            title="Logout"
          >
            <FaSignOutAlt className="h-5 w-5" />
          </button>
        </div>

        <div className="flex md:hidden items-center space-x-4">
          <button 
            className="text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={handleMobileSearchClick}
            aria-label="Search"
          >
            <FaSearch className="h-5 w-5" />
          </button>
          <div className="relative" ref={mobileNotificationRef}>
            <button 
              className="text-gray-700 p-2 rounded-full hover:bg-gray-100 relative transition-colors"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <FaBell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-sm">
                  {notificationCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {showMobileSearch && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white z-40 shadow-md p-3 border-b border-gray-200">
          <div className="relative flex items-center">
            <button 
              onClick={() => {
                setShowMobileSearch(false);
                setSearchQuery('');
                setShowDropdown(false);
              }}
              className="absolute left-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="h-5 w-5" />
            </button>
            <form onSubmit={handleSearchSubmit} className="w-full">
              <input
                id="mobile-search-input"
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search people..."
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => {
                  if (searchQuery.length >= 1 && searchResults.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                autoFocus
              />
            </form>
          </div>

          {showDropdown && (
            <div className="mt-2 mx-1 bg-white rounded-lg shadow-lg py-1 z-10 max-h-80 overflow-auto border border-gray-200">
              {isSearching && (
                <div className="px-4 py-3 text-center text-gray-500">
                  <div className="animate-pulse">Searching...</div>
                </div>
              )}
              
              {!isSearching && noResults && (
                <div className="px-4 py-3 text-center text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )}
              
              {!isSearching && !noResults && searchResults.length > 0 && (
                <>
                  {searchResults.slice(0, 5).map((user) => (
                    <div 
                      key={user._id}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center transition-colors"
                      onClick={() => {
                        handleUserClick(user.email);
                        setShowMobileSearch(false);
                      }}
                    >
                      {user.profilePicture ? (
                        <img 
                          src={`data:image/jpeg;base64,${user.profilePicture}`}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover mr-3 border border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 shadow-sm">
                          <FaUserCircle className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  ))}
                  
                  {searchResults.length > 5 && (
                    <div 
                      className="px-4 py-2 text-center text-blue-600 text-sm font-medium border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => {
                        handleSearchSubmit({ preventDefault: () => {} });
                        setShowMobileSearch(false);
                      }}
                    >
                      See all results
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div 
        ref={mobileMenuRef}
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
        style={{ marginTop: '60px' }}
      >
        <div className="overflow-y-auto flex-grow">
          {userEmail && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 shadow-sm">
                  <FaUserCircle className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Your Account</div>
                  <div className="text-xs text-gray-600 truncate max-w-xs">{userEmail}</div>
                </div>
              </div>
            </div>
          )}

          <div className="p-2">
            <Link 
              to={userEmail ? `/dashboard/${userEmail}` : "/"}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaHome className="h-5 w-5 mr-3 text-blue-600" />
              <span>Home</span>
            </Link>
            
            <Link 
              to="/chatroom"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaEnvelope className="h-5 w-5 mr-3 text-blue-600" />
              <span>Messages</span>
            </Link>
            
            <Link 
              to={`/dashboard/profile/${userEmail}`}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaUserCircle className="h-5 w-5 mr-3 text-blue-600" />
              <span>Profile</span>
            </Link>
            
            <Link 
              to={`/settings/${userEmail}`}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaCog className="h-5 w-5 mr-3 text-blue-600" />
              <span>Settings</span>
            </Link>
            <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50 ml-2"
            title="Logout"
          >
            <FaSignOutAlt className="h-5 w-5" />
              Logout
          </button>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="px-4 py-2 text-gray-800 font-medium">
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {notificationCount}
                  </span>
                )}
              </div>
              
              {friendRequests.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-4 px-4">
                  No new notifications
                </div>
              ) : (
                <div className="space-y-2 px-2">
                  {friendRequests.map(request => (
                    <div key={request.requestId} className="p-3 bg-blue-50 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        {request.sender.profilePicture ? (
                          <img 
                            src={`data:image/jpeg;base64,${request.sender.profilePicture}`}
                            alt={request.sender.name}
                            className="h-10 w-10 rounded-full object-cover mr-3 border border-white shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm">
                            <FaUser className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.sender.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Sent you a friend request
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between">
                        <button 
                          onClick={(e) => handleAcceptFriendRequest(request.requestId, e)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm mr-2"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={(e) => handleRejectFriendRequest(request.requestId, e)}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors shadow-sm"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Logout Button in Mobile Menu - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 bg-white mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors font-medium"
          >
            <FaSignOutAlt className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {showNotifications && !mobileMenuOpen && (
        <div 
          className="md:hidden fixed top-0 right-0 bottom-0 w-full bg-white z-40 shadow-xl transform transition-transform duration-300 ease-in-out translate-x-0"
          style={{ marginTop: '60px' }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <button 
              onClick={() => setShowNotifications(false)}
              className="text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto h-full pb-20">
            {friendRequests.length === 0 ? (
              <div className="text-center text-gray-500 p-8">
                <FaBell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg">No new notifications</p>
                <p className="text-sm text-gray-400 mt-2">Friend requests will appear here</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {friendRequests.map(request => (
                  <div key={request.requestId} className="p-4 bg-blue-50 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-center">
                      {request.sender.profilePicture ? (
                        <img 
                          src={`data:image/jpeg;base64,${request.sender.profilePicture}`}
                          alt={request.sender.name}
                          className="h-12 w-12 rounded-full object-cover mr-3 border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm border-2 border-blue-100">
                          <FaUser className="h-6 w-6 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {request.sender.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Sent you a friend request
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between space-x-3">
                      <button 
                        onClick={(e) => handleAcceptFriendRequest(request.requestId, e)}
                        className="flex-1 py-3 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
                      >
                        Accept Request
                      </button>
                      <button 
                        onClick={(e) => handleRejectFriendRequest(request.requestId, e)}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 text-base font-medium rounded-md hover:bg-gray-300 transition-colors shadow-sm flex items-center justify-center"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
          style={{ marginTop: '60px' }}
        />
      )}
      
      {showNotifications && !mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowNotifications(false)}
          style={{ marginTop: '60px' }}
        />
      )}
    </>
  );
}

export default Nav;
