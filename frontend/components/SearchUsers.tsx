"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";

interface SearchUsersProps {
  followingUsers: string[];
  onFollow: (userId: string) => void;
}

export default function SearchUsers({
  followingUsers,
  onFollow,
}: SearchUsersProps) {
  const { token, userId } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/api/users/search?q=${query}`, {
        headers: authHeaders(token),
      });
      const data: User[] = Array.isArray(res.data) ? res.data : [];
      setSearchResults(data.filter((u) => u._id !== userId));
    } catch {
      setSearchResults([]);
    }
  };

  const viewProfile = (id: string) => {
    if (id === userId) {
      router.push("/profile");
    } else {
      router.push(`/users/${id}`);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="feedSearchBar" style={{ position: "static" }}>
      <input
        type="text"
        placeholder="🔍 Search users, posts, or content..."
        value={searchQuery}
        onChange={(e) => searchUsers(e.target.value)}
        className="feedSearchInput"
      />
      {searchQuery && searchResults.length > 0 && (
        <div className="feedSearchResults">
          {searchResults.map((user) => (
            <div key={user._id} className="feedSearchResult">
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flex: 1,
                  cursor: "pointer",
                }}
                onClick={() => viewProfile(user._id)}
              >
                <div className="searchResultAvatar">
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
                <div className="searchResultInfo">
                  <p className="searchResultName">{user.username}</p>
                  <p className="searchResultBio">
                    {user.bio ? user.bio.substring(0, 40) : "No bio"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFollow(user._id)}
                style={{
                  padding: "6px 12px",
                  background: followingUsers.includes(user._id)
                    ? "#e74c3c"
                    : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                {followingUsers.includes(user._id) ? "Unfollow" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
