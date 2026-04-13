import React from "react";
import { ChatWorkspace } from "../chat";
import { useAuth } from "../context/AuthContext";

const Chat: React.FC = () => {
  const { appUser } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <ChatWorkspace appUser={appUser} />
    </div>
  );
};

export default Chat;
