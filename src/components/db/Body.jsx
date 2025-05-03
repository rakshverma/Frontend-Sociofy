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
  const [showSidebar, setShowSidebar] = useState(false);
  const fileInputRef = useRef(null);
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

  // Handle click outside sidebar to close it on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.getElementById('sidebar');
      if (showSidebar && sidebar && !sidebar.contains(event.target) && 
          !event.target.classList.contains('sidebar-toggle')) {
        setShowSidebar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSidebar]);

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
    setShowSidebar(false); // Close sidebar after navigation on mobile
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

  const triggerFileInput = () => {
    fileInputRef.current.click();
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

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="pt-10 flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle button */}
      <button 
        className="sidebar-toggle md:hidden fixed top-16 left-4 z-30 bg-blue-500 text-white p-2 rounded-full shadow-lg"
        onClick={toggleSidebar}
      >
        <i className={`bx ${showSidebar ? 'bx-x' : 'bx-menu'} text-xl`}></i>
      </button>

      {/* Sidebar */}
      <aside 
        id="sidebar"
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static z-20 w-72 h-screen bg-white shadow-lg p-6 transition-transform duration-300 ease-in-out overflow-y-auto`}
      >
        <div className="text-center">
          {userProfile?.profilePicture ? (
            <img
              src={`data:image/png;base64,${userProfile.profilePicture}`}
              alt="Profile"
              className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 cursor-pointer object-cover"
              onClick={() => setModalImage(`data:image/png;base64,${userProfile.profilePicture}`)}
            />
          ) : (
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 bg-gray-200 flex items-center justify-center">
              <i className="bx bx-user text-5xl text-gray-400"></i>
            </div>
          )}
          <h2 className="mt-3 text-xl font-semibold">{userProfile?.name || "User"}</h2>
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
                  className="flex items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-all duration-200"
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
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm py-2">No friends yet</p>
            )}
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 md:ml-0 mt-10 md:mt-0">
        <form className="bg-white p-4 md:p-6 rounded-lg shadow-lg" onSubmit={handleUpload}>
          <div className="flex items-center space-x-3 mb-4">
            {userProfile?.profilePicture ? (
              <img
                src={`data:image/png;base64,${userProfile.profilePicture}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <i className="bx bx-user text-gray-400"></i>
              </div>
            )}
            <textarea
              placeholder="What's on your mind?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              rows="2"
            />
          </div>
          
          {preview && (
            <div className="relative mt-3 inline-block">
              <img
                src={preview}
                alt="Preview"
                className="rounded-lg max-w-full h-auto max-h-60 cursor-pointer"
                onClick={() => setModalImage(preview)}
              />
              <button
                type="button"
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100 transition"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
              >
                <i className="bx bx-x text-lg"></i>
              </button>
            </div>
          )}
          
          {uploadError && <p className="text-red-500 mt-2 text-sm">{uploadError}</p>}
          
          <div className="flex items-center justify-between mt-4 border-t pt-3">
            <button
              type="button"
              onClick={triggerFileInput}
              className="flex items-center text-gray-600 hover:text-blue-500 transition"
            >
              <i className="bx bx-image-alt text-xl mr-1"></i>
              <span className="text-sm">Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition shadow-sm"
            >
              Post
            </button>
          </div>
        </form>
        
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : null}
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
              <p>{error}</p>
            </div>
          )}
          
          {uploadedPosts.map((post) => (
            <div key={post._id} className="bg-white p-4 rounded-lg shadow-md transition hover:shadow-lg">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <i className="bx bx-user text-gray-400"></i>
                </div>
                <div>
                  <strong className="text-gray-800">{post.userName}</strong>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {post.text && <p className="text-gray-700 mb-3">{post.text}</p>}
              
              {post.image && (
                <div className="mt-2 mb-3">
                  <img
                      src={`data:image/png;base64,${post.image}`}
                    alt="Post"
                    className="w-full h-auto object-cover rounded-lg cursor-pointer"
                    onClick={() => setModalImage(`data:image/png;base64,${post.image}`)}
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-t border-b border-gray-100 my-2">
                <button 
                  onClick={() => handleLike(post._id)} 
                  className={`flex items-center px-2 py-1 rounded-md transition ${
                    post.likes.includes(email) 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <i className={`bx ${post.likes.includes(email) ? 'bxs-like' : 'bx-like'} mr-1`}></i>
                  <span>{post.likes.length}</span>
                </button>
                
                <button 
                  onClick={() => setShowCommentsForPost(post._id)}
                  className="flex items-center px-2 py-1 text-gray-600 rounded-md hover:bg-gray-50 transition"
                >
                  <i className="bx bx-comment mr-1"></i>
                  <span>{post.comments?.length || 0}</span>
                </button>
                
                {post.userId === userProfile?._id && (
                  <button 
                    onClick={() => handleDelete(post._id)} 
                    className="flex items-center px-2 py-1 text-gray-600 rounded-md hover:bg-gray-50 transition"
                  >
                    <i className="bx bx-trash mr-1"></i>
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
              
              {/* Comments section */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-2 bg-gray-50 p-2 rounded-md">
                  {getRecentComments(post.comments, 2).map((comment, index) => (
                    <div key={index} className="text-sm text-gray-700 p-2 border-b border-gray-100 last:border-0">
                      <strong>{getUserName(comment.userId)}</strong>: {comment.commentText}
                    </div>
                  ))}
                  
                  {post.comments.length > 2 && (
                    <div
                      className="text-sm text-blue-500 cursor-pointer hover:underline p-2 text-center"
                      onClick={() => setShowCommentsForPost(post._id)}
                    >
                      View all {post.comments.length} comments
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-3 flex items-center">
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
                  className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
                <button
                  onClick={() => handleComment(post._id)}
                  className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition"
                >
                  <i className="bx bx-send"></i>
                </button>
              </div>
            </div>
          ))}
          
          {uploadedPosts.length === 0 && !loading && (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <i className="bx bx-camera-off text-5xl text-gray-400"></i>
              <p className="mt-2 text-gray-600">No posts yet. Create your first post!</p>
            </div>
          )}
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
              className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition"
              onClick={() => setModalImage(null)}
            >
              <i className="bx bx-x"></i>
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
            className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCommentsForPost(null)}
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((comment, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{getUserName(comment.userId)}</p>
                        <p className="text-gray-700">{comment.commentText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
              {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex items-center">
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
                  className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
                <button
                  onClick={() => handleComment(showCommentsForPost)}
                  className="bg-blue-500 text-white p-2 rounded-r-md hover:bg-blue-600 transition"
                >
                  <i className="bx bx-send"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay for sidebar on mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}
    </div>
  );
}

export default Body;

