"use client";

import { useCallback, useEffect, useState } from "react";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Post, User, UserSettings } from "@/lib/types";

export default function ProfilePage() {
  const { token, userId, username } = useAuth();
  const [profileTab, setProfileTab] = useState<"own" | "shared" | "settings">(
    "own"
  );
  const [userProfile, setUserProfile] = useState<User>({
    _id: "",
    username: "",
    bio: "",
    profilePicture: "",
    coverPicture: "",
    followers: [],
    following: [],
    settings: {},
  });
  const [userBio, setUserBio] = useState("");
  const [userOwnPosts, setUserOwnPosts] = useState<Post[]>([]);
  const [userSharedPosts, setUserSharedPosts] = useState<Post[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    publicProfile: true,
    allowMessagesFromFollowers: true,
    hideMyLikes: false,
    notifications: {
      postLikes: true,
      comments: true,
      messages: true,
      followers: true,
    },
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [coverPictureFile, setCoverPictureFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get(`/api/users/${userId}`, {
        headers: authHeaders(token),
      });
      setUserProfile(res.data);
      setUserBio(res.data.bio || "");
      setUserSettings(res.data.settings || {});
    } catch {
      /* ignore */
    }
  }, [token, userId]);

  const fetchUserOwnPosts = useCallback(async () => {
    try {
      const res = await api.get(`/api/posts/user/${userId}/own`, {
        headers: authHeaders(token),
      });
      setUserOwnPosts(res.data);
    } catch {
      /* ignore */
    }
  }, [token, userId]);

  const fetchUserSharedPosts = useCallback(async () => {
    try {
      const res = await api.get(`/api/posts/user/${userId}/shared`, {
        headers: authHeaders(token),
      });
      setUserSharedPosts(res.data);
    } catch {
      /* ignore */
    }
  }, [token, userId]);

  useEffect(() => {
    fetchUserProfile();
    fetchUserOwnPosts();
    fetchUserSharedPosts();
  }, [fetchUserProfile, fetchUserOwnPosts, fetchUserSharedPosts]);

  const uploadProfilePicture = async () => {
    if (!profilePictureFile) {
      alert("Please select an image");
      return;
    }
    const formData = new FormData();
    formData.append("profilePicture", profilePictureFile);
    try {
      setLoading(true);
      const response = await api.post("/api/users/profile-picture", formData, {
        headers: {
          ...authHeaders(token),
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.success !== false) {
        setProfilePictureFile(null);
        alert("Profile picture updated! 📸");
        await fetchUserProfile();
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Upload failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const uploadCoverPicture = async () => {
    if (!coverPictureFile) {
      alert("Please select an image");
      return;
    }
    const formData = new FormData();
    formData.append("coverPicture", coverPictureFile);
    try {
      setLoading(true);
      const response = await api.post("/api/users/cover-picture", formData, {
        headers: {
          ...authHeaders(token),
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data.success !== false) {
        setCoverPictureFile(null);
        alert("Cover picture updated! 🖼️");
        await fetchUserProfile();
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Upload failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await api.put(
        "/api/users/settings",
        { settings: userSettings },
        { headers: authHeaders(token) }
      );
      await api.put(
        "/api/users/bio",
        { bio: userBio },
        { headers: authHeaders(token) }
      );
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Save failed";
      alert(message);
    }
  };

  return (
    <div className="profileSection">
      <div className="profileHeader">
        <div
          className="profileBanner"
          style={{
            backgroundImage: userProfile.coverPicture
              ? `url(${mediaUrl(userProfile.coverPicture)})`
              : "none",
          }}
        />
        <div className="profileInfo">
          <div className="profileAvatar">
            {userProfile.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(userProfile.profilePicture)}
                alt="Profile"
              />
            ) : (
              "👤"
            )}
          </div>
          <div className="profileDetails">
            <h2>{username}</h2>
            <p>{userProfile.email}</p>
            <p className="bio">{userBio || "✨ Welcome to Humoura!"}</p>
          </div>
        </div>
      </div>
      <div className="profileStats">
        <div className="stat">
          <span className="statNumber">{userOwnPosts.length}</span>
          <span>Posts</span>
        </div>
        <div className="statsRow">
          <div className="stat">
            <span className="statNumber">
              {userProfile.followers?.length || 0}
            </span>
            <span>Followers</span>
          </div>
          <div className="stat">
            <span className="statNumber">
              {userProfile.following?.length || 0}
            </span>
            <span>Following</span>
          </div>
        </div>
      </div>

      <div className="profileTabs">
        <button
          className={`profileTabBtn ${profileTab === "own" ? "active" : ""}`}
          onClick={() => setProfileTab("own")}
        >
          📱 My Content
        </button>
        <button
          className={`profileTabBtn ${profileTab === "shared" ? "active" : ""}`}
          onClick={() => setProfileTab("shared")}
        >
          ↗️ Shared
        </button>
        <button
          className={`profileTabBtn ${profileTab === "settings" ? "active" : ""}`}
          onClick={() => setProfileTab("settings")}
        >
          ⚙️ Settings
        </button>
      </div>

      {profileTab === "own" && (
        <div className="profileContent">
          {userOwnPosts.length === 0 ? (
            <p className="emptyProfile">
              No posts yet. Create your first post! 🚀
            </p>
          ) : (
            userOwnPosts.map((post) => (
              <div key={post._id} className="profilePostCard">
                <div className="postHeader">
                  <strong>{post.authorId?.username}</strong>
                  <small>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <p>{post.content}</p>
                {post.picture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(post.picture)}
                    alt="Post"
                    className="profilePostImage"
                  />
                )}
                <div className="postStats">
                  <span>❤️ {post.likes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {profileTab === "shared" && (
        <div className="profileContent">
          {userSharedPosts.length === 0 ? (
            <p className="emptyProfile">
              No shared content yet. Share posts from feed! 🔄
            </p>
          ) : (
            userSharedPosts.map((post) => (
              <div key={post._id} className="profilePostCard shared">
                <div className="sharedBadge">
                  Shared from {post.authorId?.username}
                </div>
                <div className="postHeader">
                  <strong>{post.authorId?.username}</strong>
                  <small>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <p>{post.content}</p>
                {post.picture && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(post.picture)}
                    alt="Post"
                    className="profilePostImage"
                  />
                )}
                <div className="postStats">
                  <span>❤️ {post.likes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {profileTab === "settings" && (
        <div className="profileSettings">
          <h3>⚙️ Account Settings</h3>
          <div className="pictureUploadSection">
            <h4>📷 Profile Picture</h4>
            {userProfile.profilePicture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(userProfile.profilePicture)}
                alt="Profile"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              />
            )}
            <label htmlFor="profilePictureInput" className="uploadBtn">
              📤 Change
            </label>
            <input
              id="profilePictureInput"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setProfilePictureFile(e.target.files?.[0] || null)
              }
              style={{ display: "none" }}
            />
            {profilePictureFile && (
              <>
                <span>✓ {profilePictureFile.name}</span>
                <button onClick={uploadProfilePicture} className="primaryBtn">
                  {loading ? "Uploading..." : "Upload"}
                </button>
              </>
            )}
          </div>
          <div className="pictureUploadSection">
            <h4>🖼️ Cover Picture</h4>
            {userProfile.coverPicture && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(userProfile.coverPicture)}
                alt="Cover"
                style={{
                  width: 150,
                  height: 80,
                  borderRadius: 8,
                  marginBottom: 10,
                  objectFit: "cover",
                }}
              />
            )}
            <label htmlFor="coverPictureInput" className="uploadBtn">
              📤 Change
            </label>
            <input
              id="coverPictureInput"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverPictureFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {coverPictureFile && (
              <>
                <span>✓ {coverPictureFile.name}</span>
                <button onClick={uploadCoverPicture} className="primaryBtn">
                  {loading ? "Uploading..." : "Upload"}
                </button>
              </>
            )}
          </div>
          <div className="settingItem">
            <label>Bio</label>
            <textarea
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              placeholder="Write your bio..."
              className="bioInput"
            />
          </div>
          <div className="settingsGroup">
            <h4>🔔 Notifications</h4>
            {(
              [
                ["postLikes", "Post Likes"],
                ["comments", "Comments"],
                ["messages", "Messages"],
                ["followers", "New Followers"],
              ] as const
            ).map(([key, label]) => (
              <div className="settingToggle" key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={userSettings.notifications?.[key] || false}
                    onChange={(e) =>
                      setUserSettings({
                        ...userSettings,
                        notifications: {
                          ...userSettings.notifications,
                          [key]: e.target.checked,
                        },
                      })
                    }
                  />{" "}
                  {label}
                </label>
              </div>
            ))}
          </div>
          <div className="settingsGroup">
            <h4>🔐 Privacy</h4>
            <div className="settingToggle">
              <label>
                <input
                  type="checkbox"
                  checked={userSettings.publicProfile || false}
                  onChange={(e) =>
                    setUserSettings({
                      ...userSettings,
                      publicProfile: e.target.checked,
                    })
                  }
                />{" "}
                Public Profile
              </label>
            </div>
            <div className="settingToggle">
              <label>
                <input
                  type="checkbox"
                  checked={userSettings.allowMessagesFromFollowers || false}
                  onChange={(e) =>
                    setUserSettings({
                      ...userSettings,
                      allowMessagesFromFollowers: e.target.checked,
                    })
                  }
                />{" "}
                Allow Messages from Followers
              </label>
            </div>
            <div className="settingToggle">
              <label>
                <input
                  type="checkbox"
                  checked={userSettings.hideMyLikes || false}
                  onChange={(e) =>
                    setUserSettings({
                      ...userSettings,
                      hideMyLikes: e.target.checked,
                    })
                  }
                />{" "}
                Hide My Likes
              </label>
            </div>
          </div>
          <button onClick={saveSettings} className="saveSetting">
            💾 Save Settings
          </button>
          {settingsSaved && <p className="savedMessage">✅ Settings saved!</p>}
        </div>
      )}
    </div>
  );
}
