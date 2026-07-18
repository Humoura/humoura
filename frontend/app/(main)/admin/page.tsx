"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, authHeaders } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Post, User } from "@/lib/types";

export default function AdminPage() {
  const { token, isAdmin } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!isAdmin) router.replace("/feed");
  }, [isAdmin, router]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await api.get("/api/posts");
      setPosts(res.data || []);
    } catch {
      /* ignore */
    }
  }, []);

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

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
      fetchAllUsers();
    }
  }, [isAdmin, fetchPosts, fetchAllUsers]);

  if (!isAdmin) return null;

  return (
    <div className="adminSection">
      <h2>👑 Admin Panel</h2>
      <div className="adminStats">
        <div className="adminCard">
          <h3>Total Posts</h3>
          <p className="adminNumber">{posts.length}</p>
        </div>
        <div className="adminCard">
          <h3>Total Users</h3>
          <p className="adminNumber">{allUsers.length}</p>
        </div>
        <div className="adminCard">
          <h3>System Status</h3>
          <p className="adminNumber" style={{ color: "#22c55e" }}>
            ✅ Active
          </p>
        </div>
      </div>
      <div className="adminActions">
        <h3>Quick Actions</h3>
        <button onClick={fetchPosts} className="adminBtn">
          🔄 Refresh Posts
        </button>
        <button onClick={fetchAllUsers} className="adminBtn">
          🔄 Refresh Users
        </button>
      </div>
      <div className="userManagement">
        <h3>User Management</h3>
        <table className="adminTable">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Posts</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  {
                    posts.filter((p) => p.authorId?._id === user._id)
                      .length
                  }
                </td>
                <td>
                  <button
                    className="actionBtn"
                    onClick={() => router.push(`/users/${user._id}`)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
