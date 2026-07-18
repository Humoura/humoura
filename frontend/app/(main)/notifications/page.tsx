"use client";

import { useCallback, useEffect, useState } from "react";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { FriendRequest, Notification } from "@/lib/types";

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/api/notifications", {
        headers: authHeaders(token),
      });
      if (res.data.friendRequests) setFriendRequests(res.data.friendRequests);
      if (res.data.notifications) setNotifications(res.data.notifications);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await api.post(
        `/api/notifications/${notificationId}/read`,
        {},
        { headers: authHeaders(token) }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch {
      /* ignore */
    }
  };

  const acceptFriendRequest = async (fromUserId: string) => {
    try {
      await api.post(
        "/api/friends/accept",
        { fromUserId },
        { headers: authHeaders(token) }
      );
      setFriendRequests((prev) => prev.filter((r) => r.from !== fromUserId));
      alert("Friend request accepted!");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to accept request";
      alert(message);
    }
  };

  const followUser = async (targetUserId: string) => {
    try {
      await api.post(
        `/api/users/follow/${targetUserId}`,
        {},
        { headers: authHeaders(token) }
      );
      setFollowingUsers((prev) => {
        if (prev.includes(targetUserId)) {
          return prev.filter((id) => id !== targetUserId);
        }
        return [...prev, targetUserId];
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Follow failed";
      alert(message);
    }
  };

  return (
    <div className="notificationsPage">
      <h2>🔔 Notifications</h2>
      <div className="notificationsList">
        {notifications.length === 0 && friendRequests.length === 0 ? (
          <div className="emptyState">
            <p>No notifications yet 🎉</p>
          </div>
        ) : (
          <>
            {friendRequests.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ marginBottom: "12px" }}>👥 Friend Requests</h3>
                {friendRequests.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      background: "var(--bg-light)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "15px",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p>
                        <strong>{req.fromUser?.username}</strong> sent you a
                        friend request
                      </p>
                      <small style={{ color: "#999" }}>
                        {new Date(req.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <button
                      onClick={() => acceptFriendRequest(req.from)}
                      style={{
                        padding: "8px 14px",
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Accept ✓
                    </button>
                  </div>
                ))}
              </div>
            )}

            {notifications.map((notification) => (
              <div
                key={notification._id}
                className="notificationCard"
                style={{
                  background: notification.isRead
                    ? "var(--bg-light)"
                    : "rgba(99,102,241,0.08)",
                  padding: "15px",
                  borderLeft: notification.isRead
                    ? "4px solid var(--border)"
                    : "4px solid #667eea",
                  marginBottom: "10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                }}
                onClick={() =>
                  !notification.isRead &&
                  markNotificationAsRead(notification._id)
                }
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    {notification.sender?.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(notification.sender.profilePicture)}
                        alt={notification.sender?.username}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "var(--bg-lighter)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        👤
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 5px 0" }}>
                      <strong>{notification.sender?.username}</strong>{" "}
                      {notification.message}
                    </p>
                    <small style={{ color: "#999" }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </small>
                  </div>
                  {notification.type === "follow" && notification.sender && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        followUser(notification.sender!._id);
                      }}
                      style={{
                        padding: "8px 12px",
                        background: followingUsers.includes(
                          notification.sender._id
                        )
                          ? "#e74c3c"
                          : "#667eea",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      {followingUsers.includes(notification.sender._id)
                        ? "Following ✓"
                        : "Follow Back"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
