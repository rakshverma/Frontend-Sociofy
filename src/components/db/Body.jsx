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
  const [showSidebar, setShowSidebar] = useState(false);

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

  // ... (keep all your existing functions unchanged, just the UI changes below)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Mobile menu button - moved inside main content area */}
      <div className="md:hidden fixed top-16 left-4 z-30">
        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <i className={`bx ${showSidebar ? 'bx-x' : 'bx-menu'} text-xl text-blue-600`}></i>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transform transition-transform duration-300 fixed md:static inset-y-0 left-0 z-20 w-64 bg-white shadow-xl p-6 overflow-y-auto`}>
        <div className="text-center mb-8">
          {userProfile?.profilePicture ? (
            <img
              src={`data:image/png;base64,${userProfile.profilePicture}`}
              alt="Profile"
              className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 cursor-pointer hover:border-blue-600 transition-all"
              onClick={() => {
                setModalImage(`data:image/png;base64,${userProfile.profilePicture}`);
                setShowSidebar(false);
              }}
            />
          ) : (
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 flex items-center justify-center">
              <i className="bx bx-user text-5xl text-gray-400"></i>
            </div>
          )}
          <h2 className="mt-3 text-xl font-semibold text-gray-800">{userProfile?.name || "User"}</h2>
          <p className="text-sm text-gray-500 mt-1">{email}</p>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 flex items-center mb-4">
            <i className="bx bx-group mr-2 text-blue-500 text-xl"></i> Friends
          </h3>
          
          <div className="mt-3 max-h-64 overflow-y-auto pr-2">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div 
                  key={friend._id} 
                  className="flex items-center py-3 px-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors mb-2"
                  onClick={() => navigateToFriendProfile(friend.email)}
                >
                  {friend.profilePicture ? (
                    <img
                      src={`data:image/png;base64,${friend.profilePicture}`}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <i className="bx bx-user text-gray-500"></i>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{friend.name}</p>
                    <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <i className="bx bx-user-plus text-3xl text-gray-400 mb-2"></i>
                <p className="text-gray-500 text-sm">No friends yet</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 mt-16 md:mt-0">
        {/* Create Post Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <form onSubmit={handleUpload} className="p-5">
            <div className="flex items-start space-x-3">
              {userProfile?.profilePicture ? (
                <img
                  src={`data:image/png;base64,${userProfile.profilePicture}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-blue-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <i className="bx bx-user text-gray-500"></i>
                </div>
              )}
              <input
                type="text"
                placeholder="What's on your mind?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            {preview && (
              <div className="mt-4 relative">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="rounded-lg w-full max-h-80 object-contain cursor-pointer" 
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
            
            <div className="mt-4 flex justify-between items-center">
              <div>
                <label className="inline-flex items-center cursor-pointer text-gray-500 hover:text-blue-500 transition-colors">
                  <i className="bx bx-image-add text-xl mr-1"></i>
                  <span className="text-sm">Photo</span>
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
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                disabled={!postText && !selectedFile}
              >
                Post
              </button>
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-red-500 text-center">{uploadError}</p>
            )}
          </form>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex items-center">
              <i className="bx bx-error-circle text-red-500 mr-2"></i>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : uploadedPosts.length === 0 ? (
          <div className="text-center py-10">
            <i className="bx bx-news text-4xl text-gray-400 mb-3"></i>
            <p className="text-gray-500">No posts yet. Share something with your friends!</p>
          </div>
        ) : (
          uploadedPosts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  {post.userProfilePicture ? (
                    <img
                      src={`data:image/png;base64,${post.userProfilePicture}`}
                      alt={post.userName}
                      className="w-10 h-10 rounded-full border-2 border-blue-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <i className="bx bx-user text-gray-500"></i>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">{post.userName}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {post.userEmail === email && (
                  <button 
                    onClick={() => handleDelete(post._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete post"
                  >
                    <i className="bx bx-trash"></i>
                  </button>
                )}
              </div>
              
              {/* Post Content */}
              <div className="p-4">
                {post.text && (
                  <p className="text-gray-700 mb-4 whitespace-pre-line">{post.text}</p>
                )}
                {post.image && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={`data:image/png;base64,${post.image}`} 
                      alt="Post" 
                      className="w-full h-auto max-h-96 object-contain cursor-pointer" 
                      onClick={() => setModalImage(`data:image/png;base64,${post.image}`)}
                    />
                  </div>
                )}
              </div>
              
              {/* Post Actions */}
              <div className="px-4 py-2 border-t border-gray-100 flex justify-between">
                <button 
                  onClick={() => handleLike(post._id)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg ${post.likes.includes(email) ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                >
                  <i className="bx bx-like text-xl"></i>
                  <span>{post.likes.length}</span>
                </button>
                <button 
                  onClick={() => setShowCommentsForPost(post._id)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg text-gray-500 hover:text-blue-500"
                >
                  <i className="bx bx-comment text-xl"></i>
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>
              
              {/* Comments Preview */}
              {post.comments && post.comments.length > 0 && (
                <div className="px-4 pb-3 border-t border-gray-100">
                  {getRecentComments(post.comments, 2).map((comment, index) => (
                    <div key={index} className="mt-2 flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <i className="bx bx-user text-gray-500 text-sm"></i>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                        <p className="text-sm font-medium text-gray-800">{getUserName(comment.userId)}</p>
                        <p className="text-sm text-gray-700">{comment.commentText}</p>
                      </div>
                    </div>
                  ))}
                  {post.comments.length > 2 && (
                    <button 
                      onClick={() => setShowCommentsForPost(post._id)}
                      className="mt-2 text-sm text-blue-500 hover:underline"
                    >
                      View all {post.comments.length} comments
                    </button>
                  )}
                </div>
              )}
              
              {/* Add Comment */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {userProfile?.profilePicture ? (
                    <img
                      src={`data:image/png;base64,${userProfile.profilePicture}`}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <i className="bx bx-user text-gray-500 text-sm"></i>
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
                      className="w-full px-3 py-2 bg-gray-50 rounded-full text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-transparent"
                    />
                    <button 
                      onClick={() => handleComment(post._id)}
                      disabled={!comments[post._id]?.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 disabled:text-gray-400"
                    >
                      <i className="bx bx-send"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

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
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                className="absolute top-0 right-0 m-4 text-white text-3xl hover:text-gray-300 transition-colors"
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
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCommentsForPost(null)}
          >
            <div 
              className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
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
                    <div key={index} className="mb-4 flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <i className="bx bx-user text-gray-500"></i>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-gray-800">{getUserName(comment.userId)}</p>
                          <p className="text-gray-700 mt-1">{comment.commentText}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {userProfile?.profilePicture ? (
                    <img
                      src={`data:image/png;base64,${userProfile.profilePicture}`}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <i className="bx bx-user text-gray-500"></i>
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
                      className="w-full px-4 py-2 bg-gray-50 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-transparent"
                    />
                    <button 
                      onClick={() => handleComment(showCommentsForPost)}
                      disabled={!comments[showCommentsForPost]?.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 disabled:text-gray-400"
                    >
                      <i className="bx bx-send text-xl"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Body;
