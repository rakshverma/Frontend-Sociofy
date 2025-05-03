import React, { useState, useEffect } from "react";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const email = localStorage.getItem("email") || "test_email";

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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [email]);

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
    setShowMobileMenu(false);
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
      fetchPosts();
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Mobile Menu Toggle Button - Positioned in body */}
      <button 
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden fixed left-4 top-20 z-30 bg-white p-2 rounded-full shadow-md text-blue-600"
      >
        <i className={`bx ${showMobileMenu ? 'bx-x' : 'bx-menu'} text-2xl`}></i>
      </button>

      <div className="pt-4 lg:pt-0 flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setShowMobileMenu(false)}
          ></div>
        )}

        {/* Sidebar - Now responsive */}
        <aside className={`fixed lg:static lg:w-72 bg-white shadow-lg p-6 h-full lg:h-auto z-20 transform transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="text-center">
            {userProfile?.profilePicture ? (
              <img
                src={`data:image/png;base64,${userProfile.profilePicture}`}
                alt="Profile"
                className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 cursor-pointer object-cover"
                onClick={() => setModalImage(`data:image/png;base64,${userProfile.profilePicture}`)}
              />
            ) : (
              <i className="bx bx-user text-7xl text-gray-400"></i>
            )}
            <h2 className="mt-3 text-xl font-semibold">{userProfile?.name || "User"}</h2>
            <p className="text-gray-500 text-sm">{userProfile?.email || ""}</p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-700 flex items-center">
              <i className="bx bx-group mr-2 text-blue-500"></i> Friends
            </h3>
            
            <div className="mt-3 max-h-64 overflow-y-auto">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div 
                    key={friend._id} 
                    className="flex items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                    onClick={() => navigateToFriendProfile(friend.email)}
                  >
                    {friend.profilePicture ? (
                      <img
                        src={`data:image/png;base64,${friend.profilePicture}`}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <i className="bx bx-user text-gray-400"></i>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{friend.name}</p>
                      <p className="text-xs text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm py-2">No friends yet</p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 lg:ml-72">
          {/* Post Creation Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md mb-6 border border-gray-100">
            <form onSubmit={handleUpload}>
              <div className="flex items-start space-x-3">
                {userProfile?.profilePicture ? (
                  <img
                    src={`data:image/png;base64,${userProfile.profilePicture}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover cursor-pointer"
                    onClick={() => setModalImage(`data:image/png;base64,${userProfile.profilePicture}`)}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <i className="bx bx-user text-gray-400"></i>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="What's on your mind?"
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                </div>
              </div>
              
              {preview && (
                <div className="mt-3 relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="rounded-xl max-w-full h-auto max-h-80 object-contain cursor-pointer shadow-sm" 
                    onClick={() => setModalImage(preview)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                  >
                    <i className="bx bx-x text-xl text-gray-700"></i>
                  </button>
                </div>
              )}
              
              <div className="mt-3 flex justify-between items-center">
                <div>
                  <label className="inline-flex items-center px-3 py-2 bg-gray-100 rounded-xl cursor-pointer hover:bg-gray-200 transition-colors">
                    <i className="bx bx-image text-blue-500 mr-2"></i>
                    <span className="text-gray-700">Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
                <button 
                  type="submit" 
                  className={`px-4 py-2 rounded-xl transition-colors ${!postText && !selectedFile ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                  disabled={!postText && !selectedFile}
                >
                  Post
                </button>
              </div>
              
              {uploadError && (
                <div className="mt-2 text-red-500 text-sm bg-red-50 p-2 rounded-lg">
                  {uploadError}
                </div>
              )}
            </form>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : null}
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="bx bx-error text-red-500 text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {uploadedPosts.length === 0 && !loading ? (
              <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
                <i className="bx bx-news text-4xl text-gray-400 mb-2"></i>
                <p className="text-gray-500">No posts yet. Create your first post!</p>
              </div>
            ) : (
              uploadedPosts.map((post) => (
                <div key={post._id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                  {/* Post Header */}
                  <div className="p-4 flex items-center space-x-3 border-b">
                    {post.userProfilePicture ? (
                      <img
                        src={`data:image/png;base64,${post.userProfilePicture}`}
                        alt={post.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <i className="bx bx-user text-gray-400"></i>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{post.userName}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {post.userId === email && (
                      <button 
                        onClick={() => handleDelete(post._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <i className="bx bx-trash text-xl"></i>
                      </button>
                    )}
                  </div>
                  
                  {/* Post Content */}
                  <div className="p-4">
                    <p className="text-gray-700 mb-3">{post.text}</p>
                    {post.image && (
                      <div className="mt-2 rounded-lg overflow-hidden">
                        <img 
                          src={`data:image/png;base64,${post.image}`} 
                          alt="Post" 
                          className="w-full h-auto max-h-96 object-contain cursor-pointer shadow-sm" 
                          onClick={() => setModalImage(`data:image/png;base64,${post.image}`)}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Post Actions */}
                  <div className="px-4 py-2 border-t flex justify-between">
                    <button 
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full ${post.likes.includes(email) ? 'text-blue-500' : 'text-gray-500'} hover:bg-gray-100 transition-colors`}
                    >
                      <i className={`bx ${post.likes.includes(email) ? 'bxs-like' : 'bx-like'} text-xl`}></i>
                      <span>{post.likes.length}</span>
                    </button>
                    <button 
                      onClick={() => setShowCommentsForPost(post._id)}
                      className="flex items-center space-x-1 px-3 py-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      <i className="bx bx-comment text-xl"></i>
                      <span>{post.comments?.length || 0}</span>
                    </button>
                      <button 
                        onClick={() => handleDelete(post._id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        🗑️
                      </button>
                    
                  </div>
                  
                  {/* Comments Preview */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="px-4 py-2 border-t bg-gray-50">
                      <div 
                        className="text-sm text-blue-500 cursor-pointer hover:underline mb-2"
                        onClick={() => setShowCommentsForPost(post._id)}
                      >
                        View all {post.comments.length} comments
                      </div>
                      
                      <div className="space-y-2">
                        {getRecentComments(post.comments, 2).map((comment, index) => (
                          <div key={index} className="text-sm text-gray-700 bg-white p-2 rounded-lg shadow-xs">
                            <strong className="text-gray-800">{getUserName(comment.userId)}</strong>: {comment.commentText}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add Comment */}
                  <div className="p-4 border-t">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        placeholder="Add a comment..." 
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
                        className="flex-1 p-2 border rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" 
                      />
                      <button 
                        onClick={() => handleComment(post._id)}
                        disabled={!comments[post._id]?.trim()}
                        className="p-2 text-blue-500 rounded-full hover:bg-blue-50 disabled:opacity-50 transition-colors"
                      >
                        <i className="bx bx-send text-xl"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img 
              src={modalImage} 
              alt="Enlarged view" 
              className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
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
            className="bg-white rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
                onClick={() => setShowCommentsForPost(null)}
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((comment, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <i className="bx bx-user text-gray-400"></i>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <p className="font-semibold text-sm">{getUserName(comment.userId)}</p>
                          <p className="text-gray-700">{comment.commentText}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
            
            <div className="p-4 border-t sticky bottom-0 bg-white">
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
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
                  className="flex-1 p-2 border rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" 
                />
                <button 
                  onClick={() => handleComment(showCommentsForPost)}
                  disabled={!comments[showCommentsForPost]?.trim()}
                  className="p-2 text-blue-500 rounded-full hover:bg-blue-50 disabled:opacity-50 transition-colors"
                >
                  <i className="bx bx-send text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Body;
