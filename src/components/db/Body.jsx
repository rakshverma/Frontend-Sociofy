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

      alert("Post uploaded successfully!");
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
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 md:w-72 bg-white shadow-md fixed h-full overflow-y-auto left-0 top-12 z-10">
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
              <div className="w-20 h-20 mx-auto rounded-full bg-gray-200 flex items-center justify-center shadow-md">
                <i className="bx bx-user text-5xl text-gray-400"></i>
              </div>
            )}
            <h2 className="mt-3 text-xl font-semibold text-gray-800">{userProfile?.name || "User"}</h2>
          </div>
          
          {/* Friends Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-700 flex items-center text-lg">
              <i className="bx bx-group mr-2 text-blue-500"></i> Friends
            </h3>
            
            <div className="mt-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div 
                    key={friend._id} 
                    className="flex items-center py-2 px-2 border-b border-gray-100 cursor-pointer hover:bg-blue-50 rounded-md transition-colors duration-150"
                    onClick={() => navigateToFriendProfile(friend.email)}
                  >
                    {friend.profilePicture ? (
                      <img
                        src={`data:image/png;base64,${friend.profilePicture}`}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3 shadow-sm">
                        <i className="bx bx-user text-xl text-gray-400"></i>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800 truncate">{friend.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm py-2 italic">No friends yet</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 md:ml-72 p-4 md:p-6 pt-16">
        {/* Create Post Form */}
        <form className="bg-white p-6 rounded-xl shadow-md mb-6" onSubmit={handleUpload}>
          <div className="flex items-center mb-4">
            {userProfile?.profilePicture ? (
              <img
                src={`data:image/png;base64,${userProfile.profilePicture}`}
                alt="Profile"
                className="w-10 h-10 rounded-full mr-3 border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <i className="bx bx-user text-xl text-gray-400"></i>
              </div>
            )}
            <h3 className="font-medium text-gray-700">Create a post</h3>
          </div>
          
          <textarea
            placeholder="What's on your mind?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-24 text-gray-700"
          />
          
          <div className="mt-3 flex flex-wrap items-center">
            <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors mr-2 mb-2">
              <i className="bx bx-image mr-2 text-blue-500"></i>
              <span className="text-sm">Add Photo</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            
            {preview && (
              <div className="relative mb-2">
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
          
          <button 
            type="submit" 
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center justify-center"
          >
            <i className="bx bx-send mr-2"></i> Post
          </button>
        </form>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500">Loading posts...</p>
            </div>
          ) : null}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          )}
          
          {uploadedPosts.length === 0 && !loading ? (
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
              <i className="bx bx-message-square-detail text-5xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">No posts yet. Be the first to share something!</p>
            </div>
          ) : null}
          
          {uploadedPosts.map((post) => (
            <div key={post._id} className="bg-white p-5 rounded-xl shadow-md transition-shadow hover:shadow-lg">
              {/* Post Header */}
              <div className="flex items-center mb-3">
                {post.userProfilePic ? (
                  <img 
                    src={`data:image/png;base64,${post.userProfilePic}`} 
                    alt={post.userName} 
                    className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <i className="bx bx-user text-xl text-gray-400"></i>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-800">{post.userName}</h4>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString(undefined, { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </p>
                </div>
              </div>
              
              {/* Post Content */}
              <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.text}</p>
              
              {post.image && (
                <div className="mb-3 text-center">
                  <img 
                    src={`data:image/png;base64,${post.image}`} 
                    alt="Post" 
                    className="rounded-lg cursor-pointer max-h-96 mx-auto object-contain border border-gray-200" 
                    onClick={() => setModalImage(`data:image/png;base64,${post.image}`)}
                  />
                </div>
              )}
              
              {/* Post Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 py-2 border-t border-b border-gray-100">
                <div>
                  {post.likes.length > 0 && (
                    <span className="flex items-center">
                      <span className="bg-blue-100 text-blue-500 w-5 h-5 rounded-full flex items-center justify-center mr-1">
                        <i className="bx bxs-like text-xs"></i>
                      </span>
                      {post.likes.length}
                    </span>
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
              <div className="flex gap-1 mt-2">
                <button 
                  onClick={() => handleLike(post._id)} 
                  className={`flex-1 py-2 flex items-center justify-center rounded-md transition-colors ${
                    post.likes.includes(email) 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className={`bx ${post.likes.includes(email) ? 'bxs-like' : 'bx-like'} mr-2`}></i>
                  Like
                </button>
                
                <button 
                  onClick={() => setShowCommentsForPost(post._id)} 
                  className="flex-1 py-2 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <i className="bx bx-comment mr-2"></i>
                  Comment
                </button>
                
                <button 
                  onClick={() => handleDelete(post._id)} 
                  className="flex-1 py-2 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <i className="bx bx-trash mr-2"></i>
                  Delete
                </button>
              </div>
              
              {/* Comments Preview */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {getRecentComments(post.comments, 2).map((comment, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-start">
                        <div className="font-medium text-gray-800 mr-2">{getUserName(comment.userId)}:</div>
                        <div className="text-gray-700">{comment.commentText}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleString(undefined, { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
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
              <div className="mt-3 flex">
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
                  className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
                <button
                  onClick={() => handleComment(post._id)}
                  className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="bx bx-send"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
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
            className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                onClick={() => setShowCommentsForPost(null)}
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((comment, index) => (
                  <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{getUserName(comment.userId)}</p>
                        <p className="text-gray-700">{comment.commentText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                  </div>
                )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
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
                  className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500" 
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
    </div>
  );
}

export default Body;
