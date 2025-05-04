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
    <div className="pt-[50px] mt-[50px] flex min-h-screen bg-gray-100">
      {/* Sidebar - Fixed position with proper spacing */}
      <aside className="hidden md:block w-72 bg-white shadow-lg p-6 fixed h-[calc(100vh-5rem)] overflow-y-auto">
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
                  className="flex items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 rounded-lg"
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

      {/* Main content with proper margin for sidebar */}
      <main className="flex-1 p-4 md:ml-72 md:p-6">
        {/* Create Post Card */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <div className="flex items-start space-x-3">
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
            <div className="flex-1">
              <input
                type="text"
                placeholder="What's on your mind?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="w-full p-3 border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t pt-3">
            <label className="flex items-center text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg cursor-pointer">
              <i className="bx bx-image text-xl text-green-500 mr-1"></i>
              <span className="text-sm">Photo</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <button 
              type="button" 
              onClick={handleUpload}
              disabled={!postText && !selectedFile}
              className={`px-4 py-1 rounded-full ${(!postText && !selectedFile) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              Post
            </button>
          </div>

          {preview && (
            <div className="mt-3 relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="rounded-lg max-w-full max-h-60 object-contain cursor-pointer" 
                onClick={() => setModalImage(preview)}
              />
              <button
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
              >
                <i className="bx bx-x text-xl"></i>
              </button>
            </div>
          )}
          {uploadError && <p className="text-red-500 mt-2 text-sm">{uploadError}</p>}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : null}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          {uploadedPosts.length === 0 && !loading ? (
            <div className="text-center py-10">
              <i className="bx bx-news text-5xl text-gray-300 mb-3"></i>
              <p className="text-gray-500">No posts yet. Share something with your friends!</p>
            </div>
          ) : null}

          {uploadedPosts.map((post) => (
            <div key={post._id} className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
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
                  <div>
                    <p className="font-semibold">{post.userName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {post.userEmail === email && (
                  <button 
                    onClick={() => handleDelete(post._id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                )}
              </div>

              <p className="text-gray-800 mt-3 mb-2">{post.text}</p>
              
              {post.image && (
                <div className="mt-2 relative">
                  <img 
                    src={`data:image/png;base64,${post.image}`} 
                    alt="Post" 
                    className="w-full max-h-96 object-contain rounded-lg cursor-pointer bg-gray-100" 
                    onClick={() => setModalImage(`data:image/png;base64,${post.image}`)}
                  />
                </div>
              )}
              
              <div className="mt-3 flex justify-between text-gray-500 border-t border-b py-2">
                <button 
                  onClick={() => handleLike(post._id)}
                  className={`flex items-center ${post.likes.includes(email) ? 'text-blue-500' : ''}`}
                >
                  <i className="bx bx-like mr-1"></i>
                  <span>{post.likes.length} Likes</span>
                </button>
                <button 
                  onClick={() => setShowCommentsForPost(post._id)}
                  className="flex items-center"
                >
                  <i className="bx bx-comment mr-1"></i>
                  <span>{post.comments?.length || 0} Comments</span>
                </button>
              </div>

              {/* Recent comments preview */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-2">
                  <div className="space-y-2">
                    {getRecentComments(post.comments, 2).map((comment, index) => (
                      <div key={index} className="flex items-start text-sm">
                        <span className="font-semibold mr-2">{getUserName(comment.userId)}:</span>
                        <span className="text-gray-700">{comment.commentText}</span>
                      </div>
                    ))}
                  </div>
                  {post.comments.length > 2 && (
                    <button
                      onClick={() => setShowCommentsForPost(post._id)}
                      className="text-blue-500 text-sm mt-1 hover:underline"
                    >
                      View all {post.comments.length} comments
                    </button>
                  )}
                </div>
              )}

              {/* Add comment */}
              <div className="mt-3 flex items-center">
                {userProfile?.profilePicture ? (
                  <img
                    src={`data:image/png;base64,${userProfile.profilePicture}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover mr-2"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                    <i className="bx bx-user text-gray-400 text-sm"></i>
                  </div>
                )}
                <div className="flex-1 relative">
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
                    className="w-full p-2 pr-10 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    disabled={!comments[post._id]?.trim()}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${!comments[post._id]?.trim() ? 'text-gray-300' : 'text-blue-500 hover:text-blue-600'}`}
                  >
                    <i className="bx bx-send"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

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
              className="max-w-full max-h-[90vh] object-contain mx-auto"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
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
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCommentsForPost(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 p-1"
                onClick={() => setShowCommentsForPost(null)}
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((comment, index) => (
                  <div key={index} className="mb-4 flex items-start">
                    {comment.userProfilePicture ? (
                      <img
                        src={`data:image/png;base64,${comment.userProfilePicture}`}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <i className="bx bx-user text-gray-400"></i>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold">{getUserName(comment.userId)}</p>
                        <p className="text-gray-700">{comment.commentText}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>
            
            <div className="p-4 border-t sticky bottom-0 bg-white">
              <div className="flex items-center">
                {userProfile?.profilePicture ? (
                  <img
                    src={`data:image/png;base64,${userProfile.profilePicture}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <i className="bx bx-user text-gray-400"></i>
                  </div>
                )}
                <div className="flex-1 relative">
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
                    className="w-full p-3 pr-12 bg-gray-50 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                  <button
                    onClick={() => handleComment(showCommentsForPost)}
                    disabled={!comments[showCommentsForPost]?.trim()}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${!comments[showCommentsForPost]?.trim() ? 'text-gray-300' : 'text-blue-500 hover:text-blue-600'}`}
                  >
                    <i className="bx bx-send text-xl"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Body;
