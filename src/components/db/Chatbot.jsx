import React, { useEffect, useState } from 'react';

function Chatbot() {
  const [data, setData] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  useEffect(() => {
    setData([
      { role: 'assistant', message: '👋 Hi! Need help navigating? I can help you go to Home, Notifications, Settings, or Private Chat.' }
    ]);
  }, []);

  const handleInputLogic = (question) => {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('home')) {
      return '🏠 You can go to the Home page by clicking the "Home" icon in the bottom navigation.';
    } else if (lowerQ.includes('notification') || lowerQ.includes('alert')) {
      return '🔔 To see your notifications, tap on the bell icon in the top-right corner.';
    } else if (lowerQ.includes('setting') || lowerQ.includes('preferences')) {
      return '⚙️ You can access Settings from the profile dropdown or side menu.';
    } else if (lowerQ.includes('chat') || lowerQ.includes('private')) {
      return '💬 Go to Private Chat by selecting a user in your contacts or clicking "Messages".';
    } else {
      return '🤔 Sorry, I didn’t quite get that. Ask me about Home, Notifications, Settings, or Private Chat!';
    }
  };

  const sendData = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setData(prev => [...prev, { role: 'user', message: userMessage }]);
    setInputValue('');

    setTimeout(() => {
      const response = handleInputLogic(userMessage);
      setData(prev => [...prev, { role: 'assistant', message: response }]);
    }, 500); // Simulate response delay
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendData();
  };

  const toggleChatbot = () => {
    setIsChatbotVisible(!isChatbotVisible);
  };

  return (
    <div className="relative z-50">
      {/* Toggle Button */}
      <button
        onClick={toggleChatbot}
        className="text-2xl fixed bottom-4 left-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full shadow-md hover:scale-105 transition-all"
      >
        {isChatbotVisible ? '🙈' : '💬'}
      </button>

      {/* Chatbot UI */}
      {isChatbotVisible && (
        <div className="fixed bottom-20 left-4 w-80 max-h-[500px] bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col overflow-hidden">
          <div className="bg-blue-500 text-white px-4 py-3 text-lg font-semibold">
            App Assistant 🤖
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-2 max-w-[75%] text-sm rounded-lg ${
                    item.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.message}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-gray-200 bg-white">
            <input
              type="text"
              placeholder="Ask about navigation..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={sendData}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
