import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

function Body() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedPosts, setUploadedPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [comments, setComments] = useState({});
  const [showCommentsForPost, setShowCommentsForPost] = useState(null);
  const [friends, setFriends] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isPostFormExpanded, setIsPostFormExpanded] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  const email = localStorage.getItem("email") || "test_email";
  const sidebarRef = useRef(null);
  const mainRef = useRef(null);

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (email) {
      fetchUserProfile();
      fetchPosts();
      fetchFriends();
    }
  
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setModalImage(null);
        setShowCommentsForPost(null);
      }
    };
  
    document.addEventListener("keydown", handleKeyDown);
    
    // Close sidebar when clicking outside on mobile
    const handleClickOutside = (event) => {
      if (sidebarRef.current && 
          !sidebarRef.current.contains(event.target) && 
          window.innerWidth < 768 && 
          sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    // Set theme
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [email, sidebarOpen, darkMode]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/${email}`);
      setUserProfile(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile.");
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${email}`);
      setUploadedPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts.");
      setLoading(false);
    }
  };

  const navigateToFriendProfile = (friendEmail) => {
    navigate(`/user-profile/${friendEmail}`);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5MB.");
      return;
    }

    setSelectedFile(file);
    setUploadError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!postText && !selectedFile) {
      setUploadError("Please enter some text or upload an image.");
      return;
    }

    const formData = new FormData();
    formData.append("text", postText);
    formData.append("email", email);
    if (selectedFile) formData.append("image", selectedFile);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedFile(null);
      setPreview(null);
      setPostText("");
      setUploadError("");
      setIsPostFormExpanded(false);
      fetchPosts();
      
      // Show success notification
      showNotification("Post uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload post. Try again.");
    }
  };

  const getUserName = (userId) => {
    const post = uploadedPosts.find(post => post.userId.toString() === userId.toString());
    return post ? post.userName : "Unknown User";
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/like/${postId}`, { email });
      fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId) => {
    const comment = comments[postId];
    if (!comment || !comment.trim()) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/comment/${postId}`, { email, comment });
      setComments({
        ...comments,
        [postId]: ""
      });
      fetchPosts();
    } catch (error) {
      console.error("Error commenting on post:", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/delete/${postId}`);
      fetchPosts();
      showNotification("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const getRecentComments = (comments, count) => {
    if (!comments || !comments.length) return [];
    return [...comments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, count);
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/${email}`);
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };
  
  const showNotification = (message) => {
    const notification = document.getElementById("notification");
    if (notification) {
      document.getElementById("notification-message").innerText = message;
      notification.classList.remove("opacity-0", "-translate-y-4");
      notification.classList.add("opacity-100", "translate-y-0");
      
      setTimeout(() => {
        notification.classList.remove("opacity-100", "translate-y-0");
        notification.classList.add("opacity-0", "-translate-y-4");
      }, 3000);
    }
  };
  
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffTime = Math.abs(now - past);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return past.toLocaleDateString();
    }
  };
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Navbar */}


      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`fixed h-full overflow-y-auto transition-all duration-300 z-20 top-14 ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } ${
          sidebarOpen ? 'left-0 shadow-lg' : '-left-80 md:left-0'
        } w-72 md:w-64 lg:w-72`}
      >
        <div className="p-6">
          <div className="text-center">
            {userProfile?.profilePicture ? (
              <img
                src={`data:image/png;base64,${userProfile.profilePicture}`}
                alt="Profile"
                className="w-20 h-20 mx-auto rounded-full border-4 border-blue-500 cursor-pointer transition transform hover:scale-105 object-cover shadow-md"
                onClick={() => setModalImage(`data:image/png;base64,${userProfile.profilePicture}`)}
              />
            ) : (
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <i className={`bx bx-user text-5xl ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}></i>
              </div>
            )}
            <h2 className="mt-3 text-xl font-semibold">{userProfile?.name || "User"}</h2>
          </div>
          
          {/* Stats */}
          <div className={`mt-6 grid grid-cols-3 gap-2 rounded-xl p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-500">{uploadedPosts.length}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-500">{friends.length}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Friends</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-blue-500">
                {uploadedPosts.reduce((acc, post) => acc + post.likes.length, 0)}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Likes</p>
            </div>
          </div>
          
          {/* Friends Section */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold flex items-center text-lg mb-3">
              <i className="bx bx-group mr-2 text-blue-500"></i> Friends
            </h3>
            
            <div className={`mt-3 max-h-64 overflow-y-auto pr-1 ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div 
                    key={friend._id} 
                    className={`flex items-center py-3 px-2 mb-2 cursor-pointer rounded-xl transition-colors duration-150 ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'
                    }`}
                    onClick={() => navigateToFriendProfile(friend.email)}
                  >
                    {friend.profilePicture ? (
                      <img
                        src={`data:image/png;base64,${friend.profilePicture}`}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <i className={`bx bx-user text-xl ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}></i>
                      </div>
                    )}
                    <div>
                      <p className="font-medium truncate">{friend.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`text-center py-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <i className="bx bx-group text-3xl text-gray-400 mb-2"></i>
                  <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No friends yet</p>
                  <button className="mt-2 text-blue-500 text-sm hover:underline">
                    Find friends
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold flex items-center text-lg mb-3">
              <i className="bx bx-link mr-2 text-blue-500"></i> Quick Links
            </h3>
            
            <ul className="space-y-2">
              <li>
                <a href="#" className={`flex items-center p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <i className="bx bx-bookmark mr-3 text-blue-500"></i>
                  <span>Saved Posts</span>
                </a>
              </li>
              <li>
                <a href="#" className={`flex items-center p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <i className="bx bx-calendar-event mr-3 text-blue-500"></i>
                  <span>Events</span>
                </a>
              </li>
              <li>
                <a href="#" className={`flex items-center p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <i className="bx bx-cog mr-3 text-blue-500"></i>
                  <span>Settings</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main 
        ref={mainRef}
        className={`transition-all duration-300 pt-16 pb-4 ${
          darkMode ? 'text-white' : 'text-gray-800'
        } ${
          sidebarOpen ? 'md:ml-64 lg:ml-72' : 'md:ml-64 lg:ml-72'
        }`}
      >
        <div className="px-4 md:px-6 max-w-4xl mx-auto">
          {/* Create Post Form */}
          <div className={`mb-6 rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div 
              className="p-4 cursor-pointer"
              onClick={() => setIsPostFormExpanded(!isPostFormExpanded)}
            >
              <div className="flex items-center">
                {userProfile?.profilePicture ? (
                  <img
                    src={`data:image/png;base64,${userProfile.profilePicture}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-3 border border-gray-200 shadow-sm object-cover"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <i className={`bx bx-user text-xl ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}></i>
                  </div>
                )}
                <div className={`flex-1 p-3 rounded-full border ${
                  darkMode ? 'border-gray-700 bg-gray-700 text-gray-400' : 'border-gray-300 bg-gray-100 text-gray-500'
                }`}>
                  What's on your mind, {userProfile?.name?.split(' ')[0] || "User"}?
                </div>
              </div>
            </div>
            
            {isPostFormExpanded && (
              <form onSubmit={handleUpload} className="px-4 pb-4">
                <textarea
                  placeholder="What's on your mind?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-200 min-h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                />
                
                <div className="mt-3 flex flex-wrap items-center">
                  <label className={`flex items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors mr-2 mb-2 ${
                    darkMode ? 'bg-gray-700 text-blue-400' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <i className="bx bx-image mr-2 text-blue-500"></i>
                    <span className="text-sm">Add Photo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  
                  <label className={`flex items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors mr-2 mb-2 ${
                    darkMode ? 'bg-gray-700 text-blue-400' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <i className="bx bx-smile mr-2 text-yellow-500"></i>
                    <span className="text-sm">Feeling</span>
                  </label>
                  
                  <label className={`flex items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors mr-2 mb-2 ${
                    darkMode ? 'bg-gray-700 text-blue-400' : 'bg-gray-100 text-gray-700'
                  }`}>
                    <i className="bx bx-map-pin mr-2 text-red-500"></i>
                    <span className="text-sm">Location</span>
                  </label>
                  
                  {preview && (
                    <div className="relative mb-2 ml-2">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="h-16 w-16 object-cover rounded-lg border border-gray-300 cursor-pointer" 
                        onClick={() => setModalImage(preview)}
                      />
                      <button 
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-600"
                        onClick={() => {
                          setPreview(null);
                          setSelectedFile(null);
                        }}
                      >
                        <i className="bx bx-x text-xs"></i>
                      </button>
                    </div>
                  )}
                </div>
                
                {uploadError && <p className="text-red-500 mt-2 text-sm">{uploadError}</p>}
                
                <div className="flex justify-end mt-4 space-x-2">
                  <button 
                    type="button" 
                    onClick={() => setIsPostFormExpanded(false)}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center justify-center"
                  >
                    <i className="bx bx-send mr-2"></i> Post
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Story Section */}
          <div className="mb-6 overflow-x-auto hide-scrollbar">
            <div className="flex space-x-4 pb-2">
              {/* Your Story */}
              <div className="flex-shrink-0 w-24">
                <div className={`relative rounded-xl overflow-hidden aspect-[3/4] border-2 border-blue-500 mb-1 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {userProfile?.profilePicture ? (
                    <img
                      src={`data:image/png;base64,${userProfile.profilePicture}`}
                      alt="Your Story"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className={`bx bx-user text-4xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-medium">
                    Your Story
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
                    <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      <i className="bx bx-plus text-white"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Friend Stories (placeholder) */}
              {friends.slice(0, 5).map((friend, index) => (
                <div key={index} className="flex-shrink-0 w-24">
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] border-2 border-blue-500 mb-1">
                    {friend.profilePicture ? (
                      <img
                        src={`data:image/png;base64,${friend.profilePicture}`}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <i className={`bx bx-user text-4xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-medium truncate px-1">
                      {friend.name?.split(' ')[0]}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Placeholder stories if no friends */}
              {friends.length === 0 && (
                Array(4).fill().map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-24">
                    <div className={`relative rounded-xl overflow-hidden aspect-[3/4] mb-1 ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs">
                        Suggestion
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className={`p-8 rounded-xl shadow-md text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Loading posts...</p>
              </div>
            ) : null}
            
            {error && (
              <div className={`border p-4 rounded-lg ${darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <p>{error}</p>
              </div>
            )}
            
            {uploadedPosts.length === 0 && !loading ? (
              <div className={`p-8 rounded-xl shadow-md text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <i className={`bx bx-message-square-detail text-5xl mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}></i>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No posts yet. Be the first to share something!</p>
              </div>
            ) : null}
            
            {uploadedPosts.map((post) => (
              <div key={post._id} className={`rounded-xl shadow-md transition-shadow hover:shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                {/* Post Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center">
                    {post.userProfilePic ? (
                      <img 
                        src={`data:image/png;base64,${post.userProfilePic}`} 
                        alt={post.userName} 
                        className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <i className={`bx bx-user text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}></i>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">{post.userName}</h4>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatTimeAgo(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                      <i className="bx bx-dots-horizontal-rounded text-xl"></i>
                    </button>
                  </div>
                </div>
                
                {/* Post Content */}
                <div className="px-4">
                  <p className={`mb-3 whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{post.text}</p>
                </div>
                
                {post.image && (
                  <div className="mb-3 text-center">
                    <img 
                      src={`data:image/png;base64,${post.image}`} 
                      alt="Post" 
                      className="w-full cursor-pointer object-contain border-y border-gray-200 dark:border-gray-700 max-h-96" 
                      onClick={() => setModalImage(`data:image/png;base64,${post.image}`)}
                    />
                  </div>
                )}
                
                {/* Post Stats */}
                <div className={`flex items-center justify-between px-4 py-2 text-sm ${darkMode ? 'text-gray-400 border-t border-gray-700' : 'text-gray-500 border-t border-gray-100'}`}>
                  <div className="flex items-center">
                    {post.likes.length > 0 && (
                      <div className="flex items-center">
                        <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center mr-1">
                          <i className="bx bxs-like text-xs"></i>
                        </span>
                        <span>{post.likes.length}</span>
                      </div>
                    )}
                  </div>
                  
                  {post.comments && post.comments.length > 0 && (
                    <span 
                      className="cursor-pointer hover:underline"
                      onClick={() => setShowCommentsForPost(post._id)}
                    >
                      {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className={`flex border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button 
                    onClick={() => handleLike(post._id)} 
                    className={`flex-1 py-2 flex items-center justify-center transition-colors ${
                      post.likes.includes(email) 
                        ? 'text-blue-500 font-medium' 
                        : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                  >
                    <i className={`bx ${post.likes.includes(email) ? 'bxs-like' : 'bx-like'} mr-2`}></i>
                    Like
                  </button>
                  
                  <button 
                    onClick={() => setShowCommentsForPost(post._id)} 
                    className={`flex-1 py-2 flex items-center justify-center transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <i className="bx bx-comment mr-2"></i>
                    Comment
                  </button>
                  
                  <button 
                    onClick={() => handleDelete(post._id)} 
                    className={`flex-1 py-2 flex items-center justify-center transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <i className="bx bx-trash mr-2"></i>
                    Delete
                  </button>
                </div>
                
                {/* Comments Preview */}
                {post.comments && post.comments.length > 0 && (
                  <div className={`mt-1 space-y-2 p-4 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}>
                    {getRecentComments(post.comments, 2).map((comment, index) => (
                      <div key={index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-start">
                          <div className="font-medium mr-2">{getUserName(comment.userId)}:</div>
                          <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{comment.commentText}</div>
                        </div>
                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTimeAgo(comment.createdAt)}
                        </div>
                      </div>
                    ))}
                    
                    {post.comments.length > 2 && (
                      <button 
                        className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
                        onClick={() => setShowCommentsForPost(post._id)}
                      >
                        View all {post.comments.length} comments
                      </button>
                    )}
                  </div>
                )}
                
                {/* Add Comment */}
                <div className={`p-4 ${post.comments && post.comments.length > 0 ? '' : `${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-100'}`}`}>
                  <div className="flex">
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      value={comments[post._id] || ""}
                      onChange={(e) => setComments({
                        ...comments,
                        [post._id]: e.target.value
                      })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleComment(post._id);
                        }
                      }} 
                      className={`flex-1 border rounded-l-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-700'
                      }`}
                    />
                    <button
                      onClick={() => handleComment(post._id)}
                      className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 transition-colors"
                    >
                      <i className="bx bx-send"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="max-w-4xl max-h-screen relative">
            <img 
              src={modalImage} 
              alt="Enlarged view" 
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-opacity"
              onClick={() => setModalImage(null)}
            >
              <i className="bx bx-x text-2xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsForPost && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCommentsForPost(null)}
        >
          <div 
            className={`rounded-xl max-w-lg w-full max-h-[90vh] shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex justify-between items-center p-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
              <h3 className="text-lg font-semibold">Comments</h3>
              <button 
                className={`w-8 h-8 flex items-center justify-center rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-500'}`}
                onClick={() => setShowCommentsForPost(null)}
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((comment, index) => (
                  <div key={index} className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{getUserName(comment.userId)}</p>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{comment.commentText}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTimeAgo(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments.length === 0 && (
                  <div className="text-center py-8">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No comments yet. Be the first to comment!</p>
                  </div>
                )}
            </div>
            
            <div className={`p-4 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
              <div className="flex">
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  value={comments[showCommentsForPost] || ""}
                  onChange={(e) => setComments({
                    ...comments,
                    [showCommentsForPost]: e.target.value
                  })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleComment(showCommentsForPost);
                    }
                  }} 
                  className={`flex-1 border rounded-l-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-700'
                  }`}
                />
                <button
                  onClick={() => handleComment(showCommentsForPost)}
                  className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="bx bx-send"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      <div 
        id="notification"
        className="fixed top-4 right-4 transform -translate-y-4 opacity-0 transition-all duration-300 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-xs z-50"
      >
        <div className="flex items-center">
          <i className="bx bx-check-circle mr-2 text-xl"></i>
          <span id="notification-message">Notification message</span>
        </div>
      </div>
      
      {/* Mobile Bottom Nav */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-200'} z-30`}>
        <div className="flex justify-around py-2">
          <button className="flex flex-col items-center justify-center w-16 py-1 text-blue-500">
            <i className="bx bxs-home text-2xl"></i>
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button className={`flex flex-col items-center justify-center w-16 py-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="bx bx-search text-2xl"></i>
            <span className="text-xs mt-1">Search</span>
          </button>
          
          <button 
            onClick={() => setIsPostFormExpanded(true)}
            className="flex flex-col items-center justify-center w-16 py-1 relative"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
              <i className="bx bx-plus text-2xl"></i>
            </div>
          </button>
          
          <button className={`flex flex-col items-center justify-center w-16 py-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="bx bx-bell text-2xl"></i>
            <span className="text-xs mt-1">Alerts</span>
          </button>
          
          <button 
            onClick={() => setSidebarOpen(true)}
            className={`flex flex-col items-center justify-center w-16 py-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <i className="bx bx-menu text-2xl"></i>
            <span className="text-xs mt-1">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Body;
