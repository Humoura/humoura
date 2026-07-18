"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Post, User, Vine } from "@/lib/types";

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { token, userId } = useAuth();
  const [profileTab, setProfileTab] = useState<"posts" | "vines">("posts");
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(
    null
  );
  const [viewingUserPosts, setViewingUserPosts] = useState<Post[]>([]);
  const [viewingUserVines, setViewingUserVines] = useState<Vine[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (id === userId) {
      router.replace("/profile");
    }
  }, [id, userId, router]);

  const fetchUserPosts = useCallback(async () => {
    try {
      const res = await api.get(`/api/users/${id}/posts`, {
        headers: authHeaders(token),
      });
      setViewingUserPosts(res.data || []);
    } catch {
      /* ignore */
    }
  }, [id, token]);

  const fetchUserVines = useCallback(async () => {
    try {
      const res = await api.get(`/api/users/${id}/vines`, {
        headers: authHeaders(token),
      });
      setViewingUserVines(res.data || []);
    } catch {
      /* ignore */
    }
  }, [id, token]);

  const fetchOtherUserProfile = useCallback(async () => {
    try {
      setLoadingProfile(true);
      const res = await api.get(`/api/users/${id}`, {
        headers: authHeaders(token),
      });
      setViewingUserProfile(res.data);
      setIsFollowing(Boolean(res.data.isFollowing));
      await fetchUserPosts();
      await fetchUserVines();
    } catch {
      alert("Failed to load user profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [id, token, fetchUserPosts, fetchUserVines]);

  useEffect(() => {
    if (id && id !== userId) fetchOtherUserProfile();
  }, [id, userId, fetchOtherUserProfile]);

  const followUser = async () => {
    try {
      const res = await api.post(
        `/api/users/follow/${id}`,
        {},
        { headers: authHeaders(token) }
      );
      setIsFollowing(res.data.isFollowing);
      await fetchOtherUserProfile();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Follow failed";
      alert(message);
    }
  };

  return (
    <div className="userProfilePage" style={{ position: "relative", padding: "20px" }}>
      {loadingProfile ? (
        <p style={{ textAlign: "center", padding: "40px" }}>
          Loading profile...
        </p>
      ) : viewingUserProfile ? (
        <>
          <button
            onClick={() => router.push("/feed")}
            style={{
              marginBottom: "20px",
              padding: "8px 16px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <div
            style={{
              width: "100%",
              height: "200px",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "0",
              background: "#667eea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {viewingUserProfile.coverPicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(viewingUserProfile.coverPicture)}
                alt="Cover"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: "48px" }}>🎨</span>
            )}
          </div>

          <div
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
              marginTop: "-20px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "var(--bg-lighter)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "36px",
                  overflow: "hidden",
                  border: "3px solid var(--bg-light)",
                  flexShrink: 0,
                }}
              >
                {viewingUserProfile.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(viewingUserProfile.profilePicture)}
                    alt={viewingUserProfile.username}
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
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 6px 0" }}>
                  {viewingUserProfile.username}
                </h2>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    margin: "0 0 12px 0",
                    fontStyle: "italic",
                  }}
                >
                  {viewingUserProfile.bio || "No bio yet"}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "24px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                      {viewingUserProfile.followersCount ?? 0}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Followers
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                      {viewingUserProfile.followingCount ?? 0}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Following
                    </div>
                  </div>
                </div>
                {id !== userId && (
                  <button
                    onClick={followUser}
                    style={{
                      padding: "10px 20px",
                      background: isFollowing ? "#e74c3c" : "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {isFollowing ? "Unfollow ❌" : "Follow ✓"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
            <button
              onClick={() => setProfileTab("posts")}
              style={{
                padding: "10px 20px",
                background:
                  profileTab === "posts" ? "#667eea" : "var(--bg-light)",
                color:
                  profileTab === "posts" ? "white" : "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              📝 Posts ({viewingUserPosts.length})
            </button>
            <button
              onClick={() => setProfileTab("vines")}
              style={{
                padding: "10px 20px",
                background:
                  profileTab === "vines" ? "#667eea" : "var(--bg-light)",
                color:
                  profileTab === "vines" ? "white" : "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              🎬 Vines ({viewingUserVines.length})
            </button>
          </div>

          {profileTab === "posts" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {viewingUserPosts.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-secondary)",
                  }}
                >
                  No posts yet 📝
                </p>
              ) : (
                viewingUserPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onUpdated={fetchUserPosts}
                    interactive={false}
                  />
                ))
              )}
            </div>
          )}

          {profileTab === "vines" && (
            <div>
              {viewingUserVines.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-secondary)",
                  }}
                >
                  No vines yet 🎬
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "15px",
                  }}
                >
                  {viewingUserVines.map((vine) => (
                    <div
                      key={vine._id}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "var(--bg-light)",
                      }}
                    >
                      <video
                        width="100%"
                        height="200"
                        controls
                        style={{ background: "#000" }}
                      >
                        <source
                          src={mediaUrl(vine.videoUrl)}
                          type="video/mp4"
                        />
                      </video>
                      <div style={{ padding: "10px" }}>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "14px",
                            color: "var(--text-primary)",
                          }}
                        >
                          {vine.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-secondary)",
          }}
        >
          Profile not found.
        </p>
      )}
    </div>
  );
}
