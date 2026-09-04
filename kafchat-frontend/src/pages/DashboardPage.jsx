import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInfoDrawer from "../components/chat/ChatInfodrawer";
import CallLayer from "../components/call/CallLayer";
import { useChat } from "../hooks/useChat";

const DashboardPage = () => {
  const { activeChat, messages, closeChat } = useChat();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden theme-app-bg theme-text relative">
      {/* Real-Time Call Overlay */}
      <CallLayer />

      {/* Main Navigation Sidebar (Visible on mobile when no activeChat) */}
      <Sidebar mobileVisible={!activeChat} />

      {/* Active Conversation Main Stage */}
      <main
        className={`flex-1 flex flex-col min-w-0 h-full theme-chat-bg ${
          activeChat ? "flex" : "hidden sm:flex"
        }`}
      >
        <ChatWindow
          onOpenInfo={() => setShowInfo((prev) => !prev)}
          onBackMobile={closeChat}
        />
      </main>

      {/* Right User/Group Profile Drawer */}
      <ChatInfoDrawer
        isOpen={showInfo && Boolean(activeChat)}
        onClose={() => setShowInfo(false)}
        messages={messages}
      />
    </div>
  );
};

export default DashboardPage;