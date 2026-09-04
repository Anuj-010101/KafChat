import { useChat } from "../hooks/useChat";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";

const ChatPage = () => {
  const { activeChat } = useChat();

  return (
    <div className="flex h-screen w-full overflow-hidden theme-app-bg">
      {/* 1. SIDEBAR (Chat List): Mobile par hide ho jayega jab activeChat open ho */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full flex flex-col border-r theme-border transition-all ${
          activeChat ? "hidden md:flex" : "flex"
        }`}
      >
        <Sidebar />
      </div>

      {/* 2. CHAT WINDOW: Mobile par tabhi dikhega jab activeChat selected ho */}
      <div
        className={`flex-1 h-full flex flex-col transition-all ${
          activeChat ? "flex" : "hidden md:flex"
        }`}
      >
        {activeChat ? (
          <ChatWindow />
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-16 h-16 rounded-3xl theme-accent-tint flex items-center justify-center text-3xl mb-3 shadow-inner">
              💬
            </div>
            <h2 className="text-base font-bold theme-text">Welcome to KafChat</h2>
            <p className="text-xs theme-text-muted mt-1 max-w-xs">
              Select a conversation or start a new chat from the sidebar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;