"use client";

import { useCallback, useEffect, useState } from "react";
import CreatePostBox from "@/components/CreatePostBox";
import PostCard from "@/components/PostCard";
import SearchUsers from "@/components/SearchUsers";
import { api, authHeaders } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Post, User } from "@/lib/types";

export default function FeedPage() {
  const { token, userId } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePicture, setProfilePicture] = useState("");
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await api.get("/api/posts");
      setPosts(res.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!token || !userId) return;
    try {
      const res = await api.get(`/api/users/${userId}`, {
        headers: authHeaders(token),
      });
      const user: User = res.data;
      setProfilePicture(user.profilePicture || "");
      if (user.following) {
        setFollowingUsers(
          user.following.map((u) => (typeof u === "string" ? u : u._id))
        );
      }
    } catch {
      /* ignore */
    }
  }, [token, userId]);

  const followUser = async (targetUserId: string) => {
    try {
      await api.post(
        `/api/users/follow/${targetUserId}`,
        {},
        { headers: authHeaders(token) }
      );
      setFollowingUsers((prev) =>
        prev.includes(targetUserId)
          ? prev.filter((id) => id !== targetUserId)
          : [...prev, targetUserId]
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Follow failed";
      alert(message);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchProfile();
  }, [fetchPosts, fetchProfile]);

  return (
    <div className="feedSection">
      <SearchUsers followingUsers={followingUsers} onFollow={followUser} />
      <CreatePostBox profilePicture={profilePicture} onCreated={fetchPosts} />
      <div className="postsFeed">
        {posts.length === 0 ? (
          <div className="emptyState">
            <p>No posts yet. Be the first to share! 🚀</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} onUpdated={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
