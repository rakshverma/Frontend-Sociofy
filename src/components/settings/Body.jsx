import React, { useState, useEffect } from "react";
import "boxicons/css/boxicons.min.css";
import "./body.css";

function SettingsBody() {
  // Load dark mode preference from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [selectedOption, setSelectedOption] = useState("account");

  useEffect(() => {
    // Apply the stored theme preference on mount
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    document.body.classList.toggle("dark-mode", newMode);
  };

  const renderSettingsContent = () => {
    switch (selectedOption) {
      case "account":
        return (
          <div className="settings-content account-settings">
            <h3>Account Settings</h3>
            <p>Update your profile information, change your password, and manage account security.</p>
            <button className="btn account-btn">Change Password</button>
          </div>
        );
      case "privacy":
        return (
          <div className="settings-content privacy-settings">
            <h3>Privacy Settings</h3>
            <p>Control who can see your activity and manage your data preferences.</p>
            <button className="btn privacy-btn">Manage Privacy</button>
          </div>
        );
      case "notifications":
        return (
          <div className="settings-content notifications-settings">
            <h3>Notification Settings</h3>
            <p>Customize your notification preferences for emails, alerts, and messages.</p>
            <button className="btn notifications-btn">Set Preferences</button>
          </div>
        );
      case "theme":
        return (
          <div className="settings-content theme-settings">
            <h3>Theme Settings</h3>
            <p>Switch between light and dark mode or customize the interface appearance.</p>
            <button className="btn theme-btn" onClick={toggleTheme}>
              {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </button>
          </div>
        );
      default:
        return <p className="settings-content">Select an option to view settings.</p>;
    }
  };

  return (
    <div className={`container ${darkMode ? "dark" : "light"}`}>
      <aside className="left-sidebar">
        <ul>
          <li className={selectedOption === "account" ? "active" : ""} onClick={() => setSelectedOption("account")}>Account</li>
          <li className={selectedOption === "privacy" ? "active" : ""} onClick={() => setSelectedOption("privacy")}>Privacy</li>
          <li className={selectedOption === "notifications" ? "active" : ""} onClick={() => setSelectedOption("notifications")}>Notifications</li>
          <li className={selectedOption === "theme" ? "active" : ""} onClick={() => setSelectedOption("theme")}>Theme</li>
        </ul>
      </aside>

      <main className="main-body">
        <h2>Settings</h2>
        {renderSettingsContent()}
      </main>
    </div>
  );
}

export default SettingsBody;
