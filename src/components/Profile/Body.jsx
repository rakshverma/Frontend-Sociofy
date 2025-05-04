import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "boxicons/css/boxicons.min.css";

function Profile() {
  const { email } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({ name: "", dateOfBirth: "", gender: "" });
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    fetchUserProfile();
    fetchFriends();
  }, [email]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/${email}`);
      setUser(response.data);
      setUpdatedUser({
        name: response.data.name,
        dateOfBirth: response.data.dateOfBirth.split("T")[0],
        gender: response.data.gender,
      });
      setLoading(false);
    } catch (error) {
      setError("Failed to load profile");
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/${email}`);
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/update-profile`, { email, ...updatedUser });
      fetchUserProfile();
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile", error);
    }
  };

  const navigateToFriendProfile = (friendEmail) => {
    navigate(`/user-profile/${friendEmail}`);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    </div>
  );

  return (
    <div className="pt-20 pb-16 md:pb-0 min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative mb-4 md:mb-0 md:mr-8">
              <img
                src={user?.profilePicture ? `data:image/jpeg;base64,${user.profilePicture}` : "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {!editMode && (
                <button 
                  onClick={() => setEditMode(true)}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 shadow-md"
                >
                  <i className="bx bx-edit"></i>
                </button>
              )}
            </div>
            
            <div className="text-center md:text-left">
              {editMode ? (
                <input
                  type="text"
                  value={updatedUser.name}
                  onChange={(e) => setUpdatedUser({ ...updatedUser, name: e.target.value })}
                  className="text-2xl font-bold bg-gray-100 border-b-2 border-blue-500 focus:outline-none mb-2 text-center"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
              )}
              <p className="text-gray-600 mb-4">{email}</p>
              
              <div className="flex space-x-4 justify-center md:justify-start">
                <div className="text-center">
                  <span className="font-semibold text-gray-800">{friends.length}</span>
                  <p className="text-sm text-gray-500">Friends</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 font-medium ${activeTab === "profile" ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 font-medium ${activeTab === "friends" ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Friends
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === "profile" ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={updatedUser.name}
                    onChange={(e) => setUpdatedUser({ ...updatedUser, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={updatedUser.dateOfBirth}
                    onChange={(e) => setUpdatedUser({ ...updatedUser, dateOfBirth: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={updatedUser.gender}
                    onChange={(e) => setUpdatedUser({ ...updatedUser, gender: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleUpdate}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center"
                  >
                    <i className="bx bx-check mr-2"></i> Save Changes
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center"
                  >
                    <i className="bx bx-x mr-2"></i> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">About</h3>
                  <p className="mt-1 text-gray-800">{user?.bio || "No bio yet"}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                    <p className="mt-1 text-gray-800">{new Date(user?.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                    <p className="mt-1 text-gray-800 capitalize">{user?.gender}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Friends ({friends.length})</h2>
            
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <i className="bx bx-user-plus text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500">No friends yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div 
                    key={friend._id} 
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => navigateToFriendProfile(friend.email)}
                  >
                    <img
                      src={friend.profilePicture ? `data:image/png;base64,${friend.profilePicture}` : "https://via.placeholder.com/40"}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{friend.name}</p>
                      <p className="text-xs text-gray-500 truncate">{friend.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
