import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import ChatRoom from "./components/Chatroom";
import Profile from "./components/Profile";
import SearchResults from "./pages/SearchResults";
import UserProfile from "./pages/UserProfile";

// Import CSS for search functionality

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard/:email" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/chatroom" element={<PrivateRoute element={<ChatRoom />} />} />
        <Route path="/dashboard/profile/:email" element={<PrivateRoute element={<Profile />} />} />
        <Route path="/settings/:email" element={<PrivateRoute element={<Settings />} />} />
        
        {/* New search-related routes */}
        <Route path="/search-results" element={<PrivateRoute element={<SearchResults />} />} />
        <Route path="/user-profile/:email" element={<PrivateRoute element={<UserProfile />} />} />
      </Routes>
    </Router>
  );
}

export default App;
