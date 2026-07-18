"use client";

import { useCallback, useEffect, useState } from "react";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Message, User } from "@/lib/types";

export default function MessagesPage() {
  const { token, userId } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAllUsers = useCallback(async () => {
    try {
      const res = await api.get("/api/users", {
        headers: authHeaders(token),
      });
      setAllUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      /* ignore */
    }
  }, [token]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get(`/api/users/${userId}`, {
        headers: authHeaders(token),
      });
      if (res.data.following) {
        setFollowingUsers(
          res.data.following.map((u: string | User) =>
            typeof u === "string" ? u : u._id
          )
        );
      }
    } catch {
      /* ignore */
    }
  }, [token, userId]);

  useEffect(() => {
    fetchAllUsers();
    fetchProfile();
  }, [fetchAllUsers, fetchProfile]);

  const fetchMessages = async (otherUserId: string) => {
    try {
      const res = await api.get(`/api/messages/${otherUserId}`, {
        headers: authHeaders(token),
      });
      setMessages(res.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleUserSelect = async (user: User) => {
    if (!followingUsers.includes(user._id)) {
      alert("You must be following each other to message! 👥");
      return;
    }
    setSelectedUser(user);
    await fetchMessages(user._id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      await api.post(
        "/api/messages/send",
        { toUserId: selectedUser._id, text: newMessage },
        { headers: authHeaders(token) }
      );
      setNewMessage("");
      await fetchMessages(selectedUser._id);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Message failed";
      alert(message);
    }
  };

  const sendVideo = async () => {
    if (!videoFile || !selectedUser) {
      alert("Please select a video and a user");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("video", videoFile);
      const uploadRes = await api.post("/api/messages/upload-video", formData, {
        headers: authHeaders(token),
      });
      await api.post(
        "/api/messages/send",
        { toUserId: selectedUser._id, videoUrl: uploadRes.data.videoUrl },
        { headers: authHeaders(token) }
      );
      setVideoFile(null);
      await fetchMessages(selectedUser._id);
      alert("Video sent! 🎥");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Video upload failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const connected = allUsers.filter(
    (u) => u._id !== userId && followingUsers.includes(u._id)
  );

  return (
    <div className="messagesSection">
      <h2>💬 Messages</h2>
      <div className="messagesContainer">
        <div className="usersList">
          <h3>Connected Users</h3>
          {connected.length === 0 ? (
            <p className="noUsers">
              No connections yet. Follow users to message them! 👥
            </p>
          ) : (
            connected.map((user) => (
              <div
                key={user._id}
                className={`userItem ${selectedUser?._id === user._id ? "selected" : ""}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="userAvatar">
                  {user.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(user.profilePicture)}
                      alt={user.username}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <span>{user.username}</span>
              </div>
            ))
          )}
        </div>
        <div className="chatArea">
          {selectedUser ? (
            <>
              <div className="chatHeader">
                <h3>Chat with {selectedUser.username}</h3>
              </div>
              <div className="messagesList">
                {messages.length === 0 ? (
                  <p className="noMessages">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message ${msg.from === userId ? "sent" : "received"}`}
                    >
                      {msg.messageType === "video" ? (
                        <video
                          controls
                          width="200"
                          style={{ borderRadius: "8px", marginBottom: "8px" }}
                        >
                          <source
                            src={mediaUrl(msg.videoUrl)}
                            type="video/mp4"
                          />
                        </video>
                      ) : (
                        msg.text
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="messageInput">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} className="primaryBtn">
                  Send
                </button>
              </div>
              <div className="videoUpload">
                <label htmlFor="videoInput">📹 Share Video</label>
                <input
                  id="videoInput"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
                <button
                  onClick={sendVideo}
                  disabled={loading}
                  className="secondaryBtn"
                >
                  {loading ? "Uploading..." : "Send Video"}
                </button>
              </div>
            </>
          ) : (
            <p className="noMessages">
              Select a connected user to start messaging
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
