import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import "./AppAdditional.css";

const API = "http://localhost:5000";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("feed");
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [allUsers, setAllUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [userProfile, setUserProfile] = useState({ bio: "", profilePicture: "", coverPicture: "", followers: [], following: [], settings: {} });
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState({});
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [coverPictureFile, setCoverPictureFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [postPictureFile, setPostPictureFile] = useState(null);
  const [vineVideoFile, setVineVideoFile] = useState(null);
  const [userBio, setUserBio] = useState("");
  const [showLoginPolicy, setShowLoginPolicy] = useState(null);
  const [userSettings, setUserSettings] = useState({
    publicProfile: true,
    allowMessagesFromFollowers: true,
    hideMyLikes: false,
    notifications: { postLikes: true, comments: true, messages: true, followers: true }
  });
  const [followingUsers, setFollowingUsers] = useState([]);
  const [vines, setVines] = useState([]);
  const [currentVineIndex, setCurrentVineIndex] = useState(0);
  const [profileTab, setProfileTab] = useState("own");
  const [userOwnPosts, setUserOwnPosts] = useState([]);
  const [userSharedPosts, setUserSharedPosts] = useState([]);
  const [shareMenu, setShareMenu] = useState({});
  const [postMenu, setPostMenu] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [vinesPagination, setVinesPagination] = useState({ page: 0, limit: 5 });
  const [showVineUpload, setShowVineUpload] = useState(false);
  const [showCreateBox, setShowCreateBox] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [pausedVineIndex, setPausedVineIndex] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [showPolicy, setShowPolicy] = useState(null);

  // State for profile viewing
  const [viewingUserId, setViewingUserId] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [viewingUserPosts, setViewingUserPosts] = useState([]);
  const [viewingUserVines, setViewingUserVines] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // =========================
  // REGISTER
  // =========================
  const register = async () => {
    if (!email || !password || !regUsername) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API}/api/auth/register`, {
        username: regUsername,
        email,
        password,
      });
      const loginRes = await axios.post(`${API}/api/auth/login`, { email, password });
      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("username", loginRes.data.user.username);
      localStorage.setItem("userId", loginRes.data.user.id);
      localStorage.setItem("isAdmin", loginRes.data.user.isAdmin || false);
      setToken(loginRes.data.token);
      setUsername(loginRes.data.user.username);
      setUserId(loginRes.data.user.id);
      setIsAdmin(loginRes.data.user.isAdmin || false);
      setEmail("");
      setPassword("");
      setRegUsername("");
      await fetchPosts();
      await fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const login = async () => {
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user.username);
      localStorage.setItem("userId", res.data.user.id);
      localStorage.setItem("isAdmin", res.data.user.isAdmin || false);
      setToken(res.data.token);
      setUsername(res.data.user.username);
      setUserId(res.data.user.id);
      setIsAdmin(res.data.user.isAdmin || false);
      setEmail("");
      setPassword("");
      await fetchPosts();
      await fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // COMMENT ON POST
  // =========================
  const commentPost = async (postId) => {
    if (!newComment.trim()) return;
    try {
      await axios.post(
        `${API}/api/posts/comment/${postId}`,
        { text: newComment },
        { headers: { Authorization: token } }
      );
      setNewComment("");
      await fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Comment failed");
    }
  };

  // =========================
  // FOLLOW / UNFOLLOW USER (unified)
  // =========================
  const followUser = async (targetUserId) => {
    try {
      const res = await axios.post(
        `${API}/api/users/follow/${targetUserId}`,
        {},
        { headers: { Authorization: token } }
      );
      // Update followingUsers list
      setFollowingUsers((prev) => {
        if (prev.includes(targetUserId)) {
          return prev.filter((id) => id !== targetUserId);
        }
        return [...prev, targetUserId];
      });
      // If we are viewing this user's profile, update isFollowing + refresh
      if (viewingUserId && viewingUserId === targetUserId) {
        setIsFollowing(res.data.isFollowing);
        await fetchOtherUserProfile(targetUserId);
      }
      await fetchAllUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Follow failed");
    }
  };

  // =========================
  // UPLOAD PROFILE PICTURE
  // =========================
  const uploadProfilePicture = async () => {
    if (!profilePictureFile) {
      alert("Please select an image");
      return;
    }
    const formData = new FormData();
    formData.append("profilePicture", profilePictureFile);
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/api/users/profile-picture`,
        formData,
        { headers: { Authorization: token, "Content-Type": "multipart/form-data" } }
      );
      if (response.data.success !== false) {
        setProfilePictureFile(null);
        alert("Profile picture updated! 📸");
        setUserProfile((prev) => ({ ...prev, profilePicture: response.data.profilePicture }));
        await fetchUserProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPLOAD COVER PICTURE
  // =========================
  const uploadCoverPicture = async () => {
    if (!coverPictureFile) {
      alert("Please select an image");
      return;
    }
    const formData = new FormData();
    formData.append("coverPicture", coverPictureFile);
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/api/users/cover-picture`,
        formData,
        { headers: { Authorization: token, "Content-Type": "multipart/form-data" } }
      );
      if (response.data.success !== false) {
        setCoverPictureFile(null);
        alert("Cover picture updated! 🖼️");
        setUserProfile((prev) => ({ ...prev, coverPicture: response.data.coverPicture }));
        await fetchUserProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UPDATE USER BIO
  // =========================
  const updateUserBio = async (newBio) => {
    setUserBio(newBio);
    try {
      await axios.put(
        `${API}/api/users/bio`,
        { bio: newBio },
        { headers: { Authorization: token } }
      );
    } catch (err) {
      console.log("Bio update error:", err);
    }
  };

  // =========================
  // UPDATE USER SETTINGS
  // =========================
  const updateUserSettings = async (newSettings) => {
    setUserSettings(newSettings);
    try {
      await axios.put(
        `${API}/api/users/settings`,
        { settings: newSettings },
        { headers: { Authorization: token } }
      );
    } catch (err) {
      console.log("Settings update error:", err);
    }
  };

  // =========================
  // FETCH OWN USER PROFILE (logged-in user)
  // =========================
  const fetchUserProfile = async () => {
    try {
      const res = await axios.get(
        `${API}/api/users/${userId}`,
        { headers: { Authorization: token } }
      );
      setUserProfile(res.data);
      setUserBio(res.data.bio || "");
      setUserSettings(res.data.settings || {});
      // Keep followingUsers in sync
      if (res.data.following) {
        setFollowingUsers(res.data.following.map((u) => u._id || u));
      }
    } catch (err) {
      console.log("Fetch profile error:", err);
    }
  };

  // =========================
  // FETCH ANOTHER USER'S PROFILE (for viewing)
  // =========================
  const fetchOtherUserProfile = async (id) => {
    try {
      setLoadingProfile(true);
      const res = await axios.get(`${API}/api/users/profile/${id}`, {
        headers: { Authorization: token },
      });
      setViewingUserProfile(res.data);
      setIsFollowing(res.data.isFollowing);
      await fetchUserPosts(id);
      await fetchUserVines(id);
      setViewingUserId(id);
      setActiveTab("userprofile");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      alert("Failed to load user profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  // =========================
  // FETCH USER POSTS (for profile viewing)
  // =========================
  const fetchUserPosts = async (id) => {
    try {
      const res = await axios.get(`${API}/api/users/${id}/posts`, {
        headers: { Authorization: token },
      });
      setViewingUserPosts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch user posts:", err);
    }
  };

  // =========================
  // FETCH USER VINES (for profile viewing)
  // =========================
  const fetchUserVines = async (id) => {
    try {
      const res = await axios.get(`${API}/api/users/${id}/vines`, {
        headers: { Authorization: token },
      });
      setViewingUserVines(res.data || []);
    } catch (err) {
      console.error("Failed to fetch user vines:", err);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("isAdmin");
    setToken("");
    setUsername("");
    setUserId("");
    setIsAdmin(false);
    setPosts([]);
    setAllUsers([]);
  };

  // =========================
  // FETCH ALL USERS
  // =========================
  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/users`, {
        headers: { Authorization: token },
      });
      setAllUsers(Array.isArray(res.data) ? res.data : []);
      if (userProfile.following) {
        setFollowingUsers(userProfile.following.map((u) => u._id || u));
      }
    } catch (err) {
      console.log("Fetch users error:", err);
    }
  };

  // =========================
  // CREATE POST
  // =========================
  const createPost = async () => {
    if (!content.trim() && !postPictureFile) {
      alert("Please add text or a picture");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (postPictureFile) formData.append("picture", postPictureFile);
      await axios.post(`${API}/api/posts/create`, formData, {
        headers: { Authorization: token },
      });
      setContent("");
      setPostPictureFile(null);
      await fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Post failed");
    }
  };

  // =========================
  // CREATE VINE
  // =========================
  const createVine = async () => {
    if (!vineVideoFile) {
      alert("Please select a video file");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("video", vineVideoFile);
      await axios.post(`${API}/api/vines/create`, formData, {
        headers: { Authorization: token },
      });
      setVineVideoFile(null);
      setShowVineUpload(false);
      alert("Vine uploaded successfully! 🎉");
      await fetchVines();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Vine upload failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH VINES
  // =========================
  const fetchVines = async () => {
    try {
      const res = await axios.get(`${API}/api/vines`, {
        headers: { Authorization: token },
      });
      setVines(res.data);
      setCurrentVineIndex(0);
    } catch (err) {
      console.log("Fetch vines error:", err);
    }
  };

  // =========================
  // DELETE POST
  // =========================
  const deletePost = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${API}/api/posts/${postId}`, {
        headers: { Authorization: token },
      });
      await fetchPosts();
      alert("Post deleted successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // =========================
  // DELETE COMMENT
  // =========================
  const deleteComment = async (postId, commentIdx) => {
    try {
      const res = await axios.delete(
        `${API}/api/posts/${postId}/comment/${commentIdx}`,
        { headers: { Authorization: token } }
      );
      setPosts(posts.map((p) => (p._id === postId ? res.data.post : p)));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // =========================
  // EDIT POST
  // =========================
  const editPost = async (postId) => {
    if (!editingPost.content.trim()) return;
    try {
      const res = await axios.put(
        `${API}/api/posts/${postId}`,
        { content: editingPost.content },
        { headers: { Authorization: token } }
      );
      setPosts(posts.map((p) => (p._id === postId ? res.data.post : p)));
      setEditingPost(null);
    } catch (err) {
      alert(err.response?.data?.message || "Edit failed");
    }
  };

  // =========================
  // SHARE POST
  // =========================
  const sharePost = async (postId, shareType, toUserId = null) => {
    try {
      await axios.post(
        `${API}/api/posts/${postId}/share`,
        { shareType, toUserId },
        { headers: { Authorization: token } }
      );
      setShareMenu({});
      if (shareType === "feed") {
        await fetchPosts();
        alert("Post shared to your feed!");
      } else {
        alert("Post shared to user!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Share failed");
    }
  };

  // =========================
  // FETCH USER OWN POSTS
  // =========================
  const fetchUserOwnPosts = async () => {
    try {
      const res = await axios.get(`${API}/api/posts/user/${userId}/own`, {
        headers: { Authorization: token },
      });
      setUserOwnPosts(res.data);
    } catch (err) {
      console.log("Fetch own posts error:", err);
    }
  };

  // =========================
  // FETCH USER SHARED POSTS
  // =========================
  const fetchUserSharedPosts = async () => {
    try {
      const res = await axios.get(`${API}/api/posts/user/${userId}/shared`, {
        headers: { Authorization: token },
      });
      setUserSharedPosts(res.data);
    } catch (err) {
      console.log("Fetch shared posts error:", err);
    }
  };

  // =========================
  // SAVE SETTINGS
  // =========================
  const saveSettings = async () => {
    try {
      await axios.put(
        `${API}/api/users/settings`,
        { settings: userSettings },
        { headers: { Authorization: token } }
      );
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Save failed");
    }
  };

  // =========================
  // LIKE POST
  // =========================
  const likePost = async (postId) => {
    try {
      await axios.put(`${API}/api/posts/like/${postId}`, {}, {
        headers: { Authorization: token },
      });
      await fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Like failed");
    }
  };

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      await axios.post(
        `${API}/api/messages/send`,
        { toUserId: selectedUser._id, text: newMessage },
        { headers: { Authorization: token } }
      );
      setNewMessage("");
      await fetchMessages(selectedUser._id);
    } catch (err) {
      alert(err.response?.data?.message || "Message failed");
    }
  };

  // =========================
  // SEND VIDEO
  // =========================
  const sendVideo = async () => {
    if (!videoFile || !selectedUser) {
      alert("Please select a video and a user");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("video", videoFile);
      const uploadRes = await axios.post(
        `${API}/api/messages/upload-video`,
        formData,
        { headers: { Authorization: token } }
      );
      await axios.post(
        `${API}/api/messages/send`,
        { toUserId: selectedUser._id, videoUrl: uploadRes.data.videoUrl },
        { headers: { Authorization: token } }
      );
      setVideoFile(null);
      await fetchMessages(selectedUser._id);
      alert("Video sent! 🎥");
    } catch (err) {
      alert(err.response?.data?.message || "Video upload failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FETCH MESSAGES
  // =========================
  const fetchMessages = async (otherUserId) => {
    try {
      const res = await axios.get(`${API}/api/messages/${otherUserId}`, {
        headers: { Authorization: token },
      });
      setMessages(res.data || []);
    } catch (err) {
      console.log("Fetch messages error:", err);
    }
  };

  // =========================
  // FETCH NOTIFICATIONS
  // =========================
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: token },
      });
      if (res.data.friendRequests) {
        setFriendRequests(res.data.friendRequests);
      }
      if (res.data.notifications) {
        setNotifications(res.data.notifications);
        setUnreadNotifications(
          res.data.notifications.filter((n) => !n.isRead).length
        );
      }
    } catch (err) {
      console.log("Fetch notifications error:", err);
    }
  };

  // =========================
  // MARK NOTIFICATION AS READ
  // =========================
  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.post(
        `${API}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: token } }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // =========================
  // SEARCH USERS
  // =========================
  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/api/users/search?q=${query}`, {
        headers: { Authorization: token },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setSearchResults(data.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    }
  };

  // =========================
  // SEND FRIEND REQUEST
  // =========================
  const sendFriendRequest = async (toUserId) => {
    try {
      await axios.post(
        `${API}/api/friends/request`,
        { toUserId },
        { headers: { Authorization: token } }
      );
      setSentRequests([...sentRequests, toUserId]);
      alert("Friend request sent!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  // =========================
  // ACCEPT FRIEND REQUEST
  // =========================
  const acceptFriendRequest = async (fromUserId) => {
    try {
      await axios.post(
        `${API}/api/friends/accept`,
        { fromUserId },
        { headers: { Authorization: token } }
      );
      setFriendRequests(friendRequests.filter((r) => r.from !== fromUserId));
      await fetchAllUsers();
      alert("Friend request accepted!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept request");
    }
  };

  // =========================
  // SELECT USER FOR MESSAGING
  // =========================
  const handleUserSelect = async (user) => {
    const isConnected = followingUsers.includes(user._id);
    if (!isConnected) {
      alert("You must be following each other to message! 👥");
      return;
    }
    setSelectedUser(user);
    await fetchMessages(user._id);
  };

  // =========================
  // VIEW USER PROFILE
  // =========================
  const viewProfile = (id) => {
    if (id === userId) {
      setActiveTab("profile");
    } else {
      fetchOtherUserProfile(id);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  // =========================
  // FETCH POSTS
  // =========================
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/api/posts`);
      setPosts(res.data || []);
    } catch (err) {
      console.log("Fetch posts error:", err);
    }
  };

  // =========================
  // LIKE VINE
  // =========================
  const likeVine = async (vineId) => {
    try {
      await axios.put(`${API}/api/vines/like/${vineId}`, {}, {
        headers: { Authorization: token },
      });
      await fetchVines();
    } catch (err) {
      alert(err.response?.data?.message || "Like failed");
    }
  };

  // =========================
  // TOGGLE VINE PAUSE/PLAY
  // =========================
  const toggleVinePause = (index) => {
    const video = document.querySelector(`.vineReel[data-index="${index}"] video`);
    if (video) {
      if (video.paused) {
        video.play();
        setPausedVineIndex(null);
      } else {
        video.pause();
        setPausedVineIndex(index);
      }
    }
  };

  // =========================
  // NEXT / PREVIOUS VINE
  // =========================
  const nextVine = () => {
    if (currentVineIndex < vines.length - 1) setCurrentVineIndex(currentVineIndex + 1);
  };

  const previousVine = () => {
    if (currentVineIndex > 0) setCurrentVineIndex(currentVineIndex - 1);
  };

  // =========================
  // LOAD ON TOKEN CHANGE
  // =========================
  useEffect(() => {
    if (token) {
      fetchPosts();
      fetchAllUsers();
      fetchUserProfile();
      fetchVines();
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // =========================
  // LOAD PROFILE POSTS
  // =========================
  useEffect(() => {
    if (token && activeTab === "profile") {
      fetchUserOwnPosts();
      fetchUserSharedPosts();
    }
  }, [activeTab, token]);

  // =========================
  // VINES SCROLL DETECTION
  // =========================
  useEffect(() => {
    if (activeTab !== "vines" || vines.length === 0) return;
    const container = document.getElementById("vinesReelContainer");
    if (!container) return;

    let lastWheelTime = 0;
    const wheelCooldown = 300;

    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastWheelTime < wheelCooldown) { e.preventDefault(); return; }
      const direction = e.deltaY > 0 ? 1 : -1;
      let nextIndex = currentVineIndex + direction;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= vines.length) nextIndex = vines.length - 1;
      if (nextIndex !== currentVineIndex) {
        setCurrentVineIndex(nextIndex);
        lastWheelTime = now;
        e.preventDefault();
        setTimeout(() => {
          const reels = container.querySelectorAll(".vineReel");
          if (reels[nextIndex]) reels[nextIndex].scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCurrentVineIndex((prev) => {
          const newIndex = Math.min(prev + 1, vines.length - 1);
          setTimeout(() => {
            const reels = container.querySelectorAll(".vineReel");
            if (reels[newIndex]) reels[newIndex].scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
          return newIndex;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCurrentVineIndex((prev) => {
          const newIndex = Math.max(prev - 1, 0);
          setTimeout(() => {
            const reels = container.querySelectorAll(".vineReel");
            if (reels[newIndex]) reels[newIndex].scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
          return newIndex;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTab, vines, currentVineIndex]);

  // =========================
  // SCROLL LISTENER
  // =========================
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 100) setShowCreateBox(true);
      else if (currentScrollY > lastScrollY && currentScrollY > 100) setShowCreateBox(false);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // =========================
  // LOGIN PAGE
  // =========================
  if (!token) {
    return (
      <div className="loginContainer">
        <div className="loginBox">
          <h1 className="logo">✨ Humoura</h1>
          <p className="tagline">Where Humor Meets Connection 😊</p>
          {!isRegister ? (
            <>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="inputField" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="inputField" />
              <button onClick={login} disabled={loading} className="primaryBtn">{loading ? "Logging in..." : "Login"}</button>
              <p style={{ textAlign: "center", marginTop: "15px", color: "var(--text-secondary)", fontSize: "14px" }}>
                Don't have an account?{" "}
                <button onClick={() => setIsRegister(true)} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}>Register</button>
              </p>
            </>
          ) : (
            <>
              <input type="text" placeholder="Username" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="inputField" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="inputField" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="inputField" />
              <button onClick={register} disabled={loading} className="primaryBtn">{loading ? "Registering..." : "Register"}</button>
              <p style={{ textAlign: "center", marginTop: "15px", color: "var(--text-secondary)", fontSize: "14px" }}>
                Already have an account?{" "}
                <button onClick={() => setIsRegister(false)} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}>Login</button>
              </p>
            </>
          )}
          <div className="policyFooter">
            <button onClick={() => setShowLoginPolicy("terms")} className="policyLink">Terms of Service</button>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
            <button onClick={() => setShowLoginPolicy("guidelines")} className="policyLink">Community Guidelines</button>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
            <button onClick={() => setShowLoginPolicy("privacy")} className="policyLink">Privacy Policy</button>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // LOGIN POLICY PAGE
  // =========================
  if (showLoginPolicy) {
    return (
      <div className="loginContainer">
        <div className="policyPage" style={{ width: "90%", maxWidth: "800px", height: "auto", maxHeight: "90vh", padding: "40px", margin: "0 auto" }}>
          <button onClick={() => setShowLoginPolicy(null)} className="backBtn">← Back</button>
          {showLoginPolicy === "privacy" && (
            <div className="policyContent">
              <h1>🔐 Privacy Policy</h1>
              <p><strong>Effective Date:</strong> May 12, 2026</p>
              <p>Welcome to Humoura ("we," "our," or "us"). Humoura is a social platform designed to share funny and uplifting videos and content.</p>
              <h2>Information We Collect</h2>
              <ul>
                <li>Account information such as username, email address, and password</li>
                <li>Content you post, including videos, comments, and messages</li>
                <li>Usage data such as pages visited and interactions</li>
                <li>Device and browser information</li>
                <li>Cookies and similar technologies</li>
              </ul>
              <h2>How We Use Your Information</h2>
              <ul>
                <li>Create and manage your account</li>
                <li>Provide and improve the platform</li>
                <li>Display your content to other users</li>
                <li>Communicate with you</li>
                <li>Prevent abuse and maintain security</li>
              </ul>
              <h2>Contact</h2>
              <p>If you have questions, contact us at: support@humoura.com</p>
            </div>
          )}
          {showLoginPolicy === "terms" && (
            <div className="policyContent">
              <h1>⚖️ Terms of Service</h1>
              <p><strong>Effective Date:</strong> May 12, 2026</p>
              <p>Welcome to Humoura. By accessing or using Humoura, you agree to these Terms of Service.</p>
              <h2>Eligibility</h2>
              <p>You must be at least 13 years old to use Humoura.</p>
              <h2>User Content</h2>
              <p>You retain ownership of the content you post, but you grant Humoura a worldwide, non-exclusive license to host and display your content.</p>
              <h2>Prohibited Content</h2>
              <p>Users may not post content that violates laws, infringes copyrights, contains harassment, or promotes illegal activity.</p>
              <h2>Contact</h2>
              <p>support@humoura.com</p>
            </div>
          )}
          {showLoginPolicy === "guidelines" && (
            <div className="policyContent">
              <h1>👥 Community Guidelines</h1>
              <p>Humoura exists to spread laughter, positivity, and meaningful connection.</p>
              <h2>Be Respectful</h2>
              <p>Treat others with kindness and respect.</p>
              <h2>Keep It Fun and Positive</h2>
              <p>Content should align with Humoura's goal of providing uplifting and entertaining experiences.</p>
              <h2>No Harmful Content</h2>
              <p>Do not post harassment, hate speech, graphic violence, sexually explicit material, illegal content, or spam.</p>
              <h2>Our Mission</h2>
              <p>Humoura was created to help people smile, relax, and enjoy a more positive online experience.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================
  // MAIN APP
  // =========================
  return (
    <div className="appContainer">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h1 className="logo">✨ Humoura</h1>
        <nav className="navMenu">
          <button className={`navItem ${activeTab === "feed" ? "active" : ""}`} onClick={() => setActiveTab("feed")}>📱 Feed</button>
          <button className={`navItem ${activeTab === "messages" ? "active" : ""}`} onClick={() => setActiveTab("messages")}>💬 Messages</button>
          <button className={`navItem ${activeTab === "vines" ? "active" : ""}`} onClick={() => setActiveTab("vines")}>🎬 Vines</button>
          <button
            className={`navItem ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
            style={{ position: "relative" }}
          >
            🔔 Notifications
            {unreadNotifications > 0 && (
              <span style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                background: "#e74c3c",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                {unreadNotifications}
              </span>
            )}
          </button>
          <button className={`navItem ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>👤 Profile</button>
          {isAdmin && (
            <button className={`navItem ${activeTab === "admin" ? "active" : ""}`} onClick={() => setActiveTab("admin")}>👑 Admin</button>
          )}
        </nav>
        <button onClick={logout} className="logoutBtn">Logout</button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="mainContent">

        {/* ===================== FEED TAB ===================== */}
        {activeTab === "feed" && (
          <div className="feedSection">
            {/* SEARCH BAR */}
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
                      <div style={{ display: "flex", gap: "12px", flex: 1, cursor: "pointer" }} onClick={() => viewProfile(user._id)}>
                        <div className="searchResultAvatar">
                          {user.profilePicture ? (
                            <img src={`${API}${user.profilePicture}`} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : "👤"}
                        </div>
                        <div className="searchResultInfo">
                          <p className="searchResultName">{user.username}</p>
                          <p className="searchResultBio">{user.bio ? user.bio.substring(0, 40) : "No bio"}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => followUser(user._id)}
                        style={{ padding: "6px 12px", background: followingUsers.includes(user._id) ? "#e74c3c" : "#667eea", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}
                      >
                        {followingUsers.includes(user._id) ? "Unfollow" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CREATE POST */}
            <div className="createPostBox">
              <div className="postHeader">
                <div className="userAvatar">
                  {userProfile.profilePicture ? (
                    <img src={`${API}${userProfile.profilePicture}`} alt={username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : "👤"}
                </div>
                <div>
                  <p className="username">{username}</p>
                  <small>Share something amazing...</small>
                </div>
              </div>
              <textarea
                placeholder="What's on your mind? Share your humor! 😄"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="postTextarea"
              />
              <div className="postControls">
                <label htmlFor="postPictureInput" className="uploadBtn" title="Add picture">📷 Picture</label>
                <input id="postPictureInput" type="file" accept="image/*" onChange={(e) => setPostPictureFile(e.target.files[0])} style={{ display: "none" }} />
                {postPictureFile && <span className="fileSelected">✓ {postPictureFile.name}</span>}
              </div>
              {postPictureFile && (
                <div className="picturePreview">
                  <img src={URL.createObjectURL(postPictureFile)} alt="Preview" />
                </div>
              )}
              <button onClick={createPost} className="primaryBtn">Post ✨</button>
            </div>

            {/* POSTS FEED */}
            <div className="postsFeed">
              {posts.length === 0 ? (
                <div className="emptyState"><p>No posts yet. Be the first to share! 🚀</p></div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="postCard">
                    <div className="postHeader">
                      <div className="userAvatar">
                        {post.authorId?.profilePicture ? (
                          <img src={`${API}${post.authorId.profilePicture}`} alt={post.authorId?.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : "👤"}
                      </div>
                      <div>
                        <p className="username">{post.authorId?.username || "Unknown"}</p>
                        <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                      </div>
                    </div>
                    <p className="postContent">{post.content}</p>
                    {post.picture && (
                      <div className="postPictureContainer">
                        <img src={`${API}${post.picture}`} alt="Post" className="postPicture" />
                      </div>
                    )}
                    <div className="postActions">
                      <button onClick={() => likePost(post._id)} className="actionBtn likeBtn">❤️ {post.likes?.length || 0}</button>
                      <button className="actionBtn" onClick={() => setShowComments({ ...showComments, [post._id]: !showComments[post._id] })}>💬 {post.comments?.length || 0}</button>
                      <button className="actionBtn" onClick={() => setShareMenu({ ...shareMenu, [post._id]: !shareMenu[post._id] })}>📤 Share</button>
                      {(post.authorId?._id === userId || isAdmin) && (
                        <div className="postMenuContainer">
                          <button className="postMenuBtn" onClick={() => setPostMenu({ ...postMenu, [post._id]: !postMenu[post._id] })} title="More options">⋯</button>
                          {postMenu[post._id] && (
                            <div className="postMenuDropdown">
                              {post.authorId?._id === userId && (
                                <button onClick={() => { setEditingPost({ postId: post._id, content: post.content }); setPostMenu({}); }} className="menuOption">✏️ Edit</button>
                              )}
                              {(isAdmin || post.authorId?._id === userId) && (
                                <button onClick={() => { deletePost(post._id); setPostMenu({}); }} className="menuOption delete">🗑️ Delete</button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {shareMenu[post._id] && (
                      <div className="shareMenuBox">
                        <button onClick={() => sharePost(post._id, "feed")} className="shareOption">📤 Share to Feed</button>
                        <button onClick={() => setShareMenu({})} className="shareOption">👤 Share to User</button>
                      </div>
                    )}
                    {editingPost?.postId === post._id && (
                      <div className="editPostBox">
                        <textarea value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} className="postTextarea" />
                        <button onClick={() => editPost(post._id)} className="primaryBtn">Save</button>
                        <button onClick={() => setEditingPost(null)} className="secondaryBtn">Cancel</button>
                      </div>
                    )}
                    {showComments[post._id] && (
                      <div className="commentsSection">
                        <div className="commentsList">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment, idx) => (
                              <div key={idx} className="commentItem">
                                <div className="commentHeader">
                                  <strong>{comment.userId?.username || "Unknown"}</strong>
                                  {(isAdmin || comment.userId?._id === userId || post.authorId?._id === userId) && (
                                    <button onClick={() => deleteComment(post._id, idx)} className="deleteCommentBtn" title="Delete comment">✕</button>
                                  )}
                                </div>
                                <p>{comment.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="noComments">No comments yet</p>
                          )}
                        </div>
                        <div className="addCommentBox">
                          <input type="text" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                          <button onClick={() => commentPost(post._id)} className="commentBtn">Post</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===================== MESSAGES TAB ===================== */}
        {activeTab === "messages" && (
          <div className="messagesSection">
            <h2>💬 Messages</h2>
            <div className="messagesContainer">
              <div className="usersList">
                <h3>Connected Users</h3>
                {allUsers.filter((u) => u._id !== userId && followingUsers.includes(u._id)).length === 0 ? (
                  <p className="noUsers">No connections yet. Follow users to message them! 👥</p>
                ) : (
                  allUsers.filter((u) => u._id !== userId && followingUsers.includes(u._id)).map((user) => (
                    <div key={user._id} className={`userItem ${selectedUser?._id === user._id ? "selected" : ""}`} onClick={() => handleUserSelect(user)}>
                      <div className="userAvatar">
                        {user.profilePicture ? (
                          <img src={`${API}${user.profilePicture}`} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : "👤"}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="chatArea">
                {selectedUser ? (
                  <>
                    <div className="chatHeader"><h3>Chat with {selectedUser.username}</h3></div>
                    <div className="messagesList">
                      {messages.length === 0 ? (
                        <p className="noMessages">No messages yet. Start the conversation!</p>
                      ) : (
                        messages.map((msg, idx) => (
                          <div key={idx} className={`message ${msg.from === userId ? "sent" : "received"}`}>
                            {msg.messageType === "video" ? (
                              <video controls width="200" style={{ borderRadius: "8px", marginBottom: "8px" }}>
                                <source src={`${API}${msg.videoUrl}`} type="video/mp4" />
                              </video>
                            ) : msg.text}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="messageInput">
                      <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
                      <button onClick={sendMessage} className="primaryBtn">Send</button>
                    </div>
                    <div className="videoUpload">
                      <label htmlFor="videoInput">📹 Share Video</label>
                      <input id="videoInput" type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} style={{ display: "none" }} />
                      <button onClick={sendVideo} disabled={loading} className="secondaryBtn">{loading ? "Uploading..." : "Send Video"}</button>
                    </div>
                  </>
                ) : (
                  <p className="noMessages">Select a connected user to start messaging</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VINES TAB ===================== */}
        {activeTab === "vines" && (
          <div className="vinesSection">
            {showVineUpload && (
              <div className="vineUploadBox">
                <h3>📹 Upload Your Vine</h3>
                <div className="vineUploadForm">
                  <label htmlFor="vineVideoInput" className="uploadBtn">Choose Video</label>
                  <input id="vineVideoInput" type="file" accept="video/*" onChange={(e) => setVineVideoFile(e.target.files[0])} style={{ display: "none" }} />
                  {vineVideoFile && <span className="fileSelected">✓ {vineVideoFile.name}</span>}
                  <button onClick={createVine} disabled={loading} className="primaryBtn">{loading ? "Uploading..." : "Post Vine 🚀"}</button>
                  <button onClick={() => setShowVineUpload(false)} className="secondaryBtn">Cancel</button>
                </div>
              </div>
            )}
            {vines.length === 0 && !showVineUpload ? (
              <div className="emptyVinesState">
                <p>🎬 No vines yet. Be the first to create one! 🎉</p>
                <button className="vineUploadBtn" onClick={() => setShowVineUpload(true)} title="Upload a new vine">➕</button>
              </div>
            ) : vines.length > 0 && !showVineUpload ? (
              <div className="vinesReelContainer" id="vinesReelContainer">
                {vines.map((vine, index) => (
                  <div key={vine._id} className="vineReel" data-index={index} onClick={() => toggleVinePause(index)}>
                    <video className="vineReelVideo" autoPlay={index === currentVineIndex} loop playsInline muted={index !== currentVineIndex}>
                      <source src={`${API}${vine.videoUrl}`} type="video/mp4" />
                    </video>
                    {pausedVineIndex === index && (
                      <div className="vinePauseOverlay"><div className="pauseIcon">⏸️</div></div>
                    )}
                    <div className="vineReelOverlay">
                      <div className="vineReelCreatorInfo">
                        <div className="vineReelAvatar" onClick={(e) => { e.stopPropagation(); viewProfile(vine.authorId?._id); }} style={{ cursor: "pointer" }}>
                          {vine.authorId?.profilePicture ? (
                            <img src={`${API}${vine.authorId.profilePicture}`} alt={vine.authorId?.username} />
                          ) : "👤"}
                        </div>
                        <div className="vineReelDetails">
                          <p className="vineReelName">{vine.authorId?.username || "Unknown"}</p>
                          <p className="vineReelDesc">{vine.description || "Check out this vine!"}</p>
                        </div>
                      </div>
                      <div className="vineReelSideActions">
                        <div className="sideActionItem">
                          <button className="vineActionIcon" onClick={(e) => { e.stopPropagation(); likeVine(vine._id); }} title="Like">❤️</button>
                          <span className="actionCount">{vine.likes?.length || 0}</span>
                        </div>
                        <div className="sideActionItem">
                          <button className="vineActionIcon" onClick={(e) => { e.stopPropagation(); }} title="Comment">💬</button>
                          <span className="actionCount">{vine.comments?.length || 0}</span>
                        </div>
                        <div className="sideActionItem">
                          <button className="vineActionIcon" onClick={(e) => { e.stopPropagation(); }} title="Share">📤</button>
                        </div>
                        <div className="sideActionItem">
                          <button className="vineActionIcon" onClick={(e) => { e.stopPropagation(); setShowVineUpload(true); }} title="Upload">➕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* ===================== NOTIFICATIONS TAB ===================== */}
        {activeTab === "notifications" && (
          <div className="notificationsPage">
            <h2>🔔 Notifications</h2>
            <div className="notificationsList">
              {notifications.length === 0 && friendRequests.length === 0 ? (
                <div className="emptyState"><p>No notifications yet 🎉</p></div>
              ) : (
                <>
                  {/* FRIEND REQUESTS */}
                  {friendRequests.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ marginBottom: "12px" }}>👥 Friend Requests</h3>
                      {friendRequests.map((req) => (
                        <div key={req._id} style={{ background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "8px", padding: "15px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p><strong>{req.fromUser?.username}</strong> sent you a friend request</p>
                            <small style={{ color: "#999" }}>{new Date(req.createdAt).toLocaleString()}</small>
                          </div>
                          <button onClick={() => acceptFriendRequest(req.from)} style={{ padding: "8px 14px", background: "#22c55e", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Accept ✓</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* NOTIFICATIONS */}
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="notificationCard"
                      style={{
                        background: notification.isRead ? "var(--bg-light)" : "rgba(99,102,241,0.08)",
                        padding: "15px",
                        borderLeft: notification.isRead ? "4px solid var(--border)" : "4px solid #667eea",
                        marginBottom: "10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        border: "1px solid var(--border)"
                      }}
                      onClick={() => !notification.isRead && markNotificationAsRead(notification._id)}
                    >
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        <div>
                          {notification.sender?.profilePicture ? (
                            <img src={`${API}${notification.sender.profilePicture}`} alt={notification.sender?.username} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-lighter)", display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 5px 0" }}>
                            <strong>{notification.sender?.username}</strong> {notification.message}
                          </p>
                          <small style={{ color: "#999" }}>{new Date(notification.createdAt).toLocaleString()}</small>
                        </div>
                        {notification.type === "follow" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              followUser(notification.sender._id);
                            }}
                            style={{
                              padding: "8px 12px",
                              background: followingUsers.includes(notification.sender._id) ? "#e74c3c" : "#667eea",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}
                          >
                            {followingUsers.includes(notification.sender._id) ? "Following ✓" : "Follow Back"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* ===================== PROFILE TAB ===================== */}
        {activeTab === "profile" && (
          <div className="profileSection">
            <div className="profileHeader">
              <div className="profileBanner" style={{ backgroundImage: userProfile.coverPicture ? `url(${API}${userProfile.coverPicture})` : "none" }}></div>
              <div className="profileInfo">
                <div className="profileAvatar">
                  {userProfile.profilePicture ? <img src={`${API}${userProfile.profilePicture}`} alt="Profile" /> : "👤"}
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
                  <span className="statNumber">{userProfile.followers?.length || 0}</span>
                  <span>Followers</span>
                </div>
                <div className="stat">
                  <span className="statNumber">{userProfile.following?.length || 0}</span>
                  <span>Following</span>
                </div>
              </div>
            </div>

            <div className="profileTabs">
              <button className={`profileTabBtn ${profileTab === "own" ? "active" : ""}`} onClick={() => setProfileTab("own")}>📱 My Content</button>
              <button className={`profileTabBtn ${profileTab === "shared" ? "active" : ""}`} onClick={() => setProfileTab("shared")}>↗️ Shared</button>
              <button className={`profileTabBtn ${profileTab === "settings" ? "active" : ""}`} onClick={() => setProfileTab("settings")}>⚙️ Settings</button>
            </div>

            {profileTab === "own" && (
              <div className="profileContent">
                {userOwnPosts.length === 0 ? (
                  <p className="emptyProfile">No posts yet. Create your first post! 🚀</p>
                ) : (
                  userOwnPosts.map((post) => (
                    <div key={post._id} className="profilePostCard">
                      <div className="postHeader">
                        <strong>{post.authorId?.username}</strong>
                        <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                      </div>
                      <p>{post.content}</p>
                      {post.picture && <img src={`${API}${post.picture}`} alt="Post" className="profilePostImage" />}
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
                  <p className="emptyProfile">No shared content yet. Share posts from feed! 🔄</p>
                ) : (
                  userSharedPosts.map((post) => (
                    <div key={post._id} className="profilePostCard shared">
                      <div className="sharedBadge">Shared from {post.authorId?.username}</div>
                      <div className="postHeader">
                        <strong>{post.authorId?.username}</strong>
                        <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                      </div>
                      <p>{post.content}</p>
                      {post.picture && <img src={`${API}${post.picture}`} alt="Post" className="profilePostImage" />}
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
                  {userProfile.profilePicture && <img src={`${API}${userProfile.profilePicture}`} alt="Profile" style={{ width: 100, height: 100, borderRadius: 10, marginBottom: 10 }} />}
                  <label htmlFor="profilePictureInput" className="uploadBtn">📤 Change</label>
                  <input id="profilePictureInput" type="file" accept="image/*" onChange={(e) => setProfilePictureFile(e.target.files[0])} style={{ display: "none" }} />
                  {profilePictureFile && <><span>✓ {profilePictureFile.name}</span><button onClick={uploadProfilePicture} className="primaryBtn">{loading ? "Uploading..." : "Upload"}</button></>}
                </div>
                <div className="pictureUploadSection">
                  <h4>🖼️ Cover Picture</h4>
                  {userProfile.coverPicture && <img src={`${API}${userProfile.coverPicture}`} alt="Cover" style={{ width: 150, height: 80, borderRadius: 8, marginBottom: 10, objectFit: "cover" }} />}
                  <label htmlFor="coverPictureInput" className="uploadBtn">📤 Change</label>
                  <input id="coverPictureInput" type="file" accept="image/*" onChange={(e) => setCoverPictureFile(e.target.files[0])} style={{ display: "none" }} />
                  {coverPictureFile && <><span>✓ {coverPictureFile.name}</span><button onClick={uploadCoverPicture} className="primaryBtn">{loading ? "Uploading..." : "Upload"}</button></>}
                </div>
                <div className="settingItem">
                  <label>Bio</label>
                  <textarea value={userBio} onChange={(e) => setUserBio(e.target.value)} placeholder="Write your bio..." className="bioInput" />
                </div>
                <div className="settingsGroup">
                  <h4>🔔 Notifications</h4>
                  {[["postLikes", "Post Likes"], ["comments", "Comments"], ["messages", "Messages"], ["followers", "New Followers"]].map(([key, label]) => (
                    <div className="settingToggle" key={key}>
                      <label>
                        <input type="checkbox" checked={userSettings.notifications?.[key] || false}
                          onChange={(e) => setUserSettings({ ...userSettings, notifications: { ...userSettings.notifications, [key]: e.target.checked } })} />
                        {" "}{label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="settingsGroup">
                  <h4>🔐 Privacy</h4>
                  <div className="settingToggle">
                    <label><input type="checkbox" checked={userSettings.publicProfile || false} onChange={(e) => setUserSettings({ ...userSettings, publicProfile: e.target.checked })} />{" "}Public Profile</label>
                  </div>
                  <div className="settingToggle">
                    <label><input type="checkbox" checked={userSettings.allowMessagesFromFollowers || false} onChange={(e) => setUserSettings({ ...userSettings, allowMessagesFromFollowers: e.target.checked })} />{" "}Allow Messages from Followers</label>
                  </div>
                  <div className="settingToggle">
                    <label><input type="checkbox" checked={userSettings.hideMyLikes || false} onChange={(e) => setUserSettings({ ...userSettings, hideMyLikes: e.target.checked })} />{" "}Hide My Likes</label>
                  </div>
                </div>
                <button onClick={saveSettings} className="saveSetting">💾 Save Settings</button>
                {settingsSaved && <p className="savedMessage">✅ Settings saved!</p>}
              </div>
            )}
          </div>
        )}

        {/* ===================== ADMIN TAB ===================== */}
        {activeTab === "admin" && isAdmin && (
          <div className="adminSection">
            <h2>👑 Admin Panel</h2>
            <div className="adminStats">
              <div className="adminCard"><h3>Total Posts</h3><p className="adminNumber">{posts.length}</p></div>
              <div className="adminCard"><h3>Total Users</h3><p className="adminNumber">{allUsers.length}</p></div>
              <div className="adminCard"><h3>System Status</h3><p className="adminNumber" style={{ color: "#22c55e" }}>✅ Active</p></div>
            </div>
            <div className="adminActions">
              <h3>Quick Actions</h3>
              <button onClick={fetchPosts} className="adminBtn">🔄 Refresh Posts</button>
              <button onClick={fetchAllUsers} className="adminBtn">🔄 Refresh Users</button>
            </div>
            <div className="userManagement">
              <h3>User Management</h3>
              <table className="adminTable">
                <thead>
                  <tr><th>Username</th><th>Email</th><th>Posts</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{posts.filter((p) => p.authorId?._id === user._id).length}</td>
                      <td><button className="actionBtn" onClick={() => viewProfile(user._id)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== USER PROFILE PAGE ===================== */}
        {activeTab === "userprofile" && (
          <div className="userProfilePage" style={{ position: "relative", padding: "20px" }}>
            {loadingProfile ? (
              <p style={{ textAlign: "center", padding: "40px" }}>Loading profile...</p>
            ) : viewingUserProfile ? (
              <>
                <button
                  onClick={() => setActiveTab("feed")}
                  style={{ marginBottom: "20px", padding: "8px 16px", background: "#667eea", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  ← Back
                </button>

                {/* COVER */}
                <div style={{ width: "100%", height: "200px", borderRadius: "12px", overflow: "hidden", marginBottom: "0", background: "#667eea", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {viewingUserProfile.coverPicture ? (
                    <img src={`${API}${viewingUserProfile.coverPicture}`} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : <span style={{ fontSize: "48px" }}>🎨</span>}
                </div>

                {/* PROFILE INFO */}
                <div style={{ background: "var(--bg-light)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginTop: "-20px", position: "relative" }}>
                  <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--bg-lighter)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", overflow: "hidden", border: "3px solid var(--bg-light)", flexShrink: 0 }}>
                      {viewingUserProfile.profilePicture ? (
                        <img src={`${API}${viewingUserProfile.profilePicture}`} alt={viewingUserProfile.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : "👤"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: "0 0 6px 0" }}>{viewingUserProfile.username}</h2>
                      <p style={{ color: "var(--text-secondary)", margin: "0 0 12px 0", fontStyle: "italic" }}>{viewingUserProfile.bio || "No bio yet"}</p>
                      <div style={{ display: "flex", gap: "24px", marginBottom: "12px" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold" }}>{viewingUserProfile.followersCount ?? 0}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Followers</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold" }}>{viewingUserProfile.followingCount ?? 0}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Following</div>
                        </div>
                      </div>
                      {viewingUserId !== userId && (
                        <button
                          onClick={() => followUser(viewingUserId)}
                          style={{ padding: "10px 20px", background: isFollowing ? "#e74c3c" : "#667eea", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                        >
                          {isFollowing ? "Unfollow ❌" : "Follow ✓"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CONTENT TABS */}
                <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
                  <button onClick={() => setProfileTab("posts")} style={{ padding: "10px 20px", background: profileTab === "posts" ? "#667eea" : "var(--bg-light)", color: profileTab === "posts" ? "white" : "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer" }}>
                    📝 Posts ({viewingUserPosts.length})
                  </button>
                  <button onClick={() => setProfileTab("vines")} style={{ padding: "10px 20px", background: profileTab === "vines" ? "#667eea" : "var(--bg-light)", color: profileTab === "vines" ? "white" : "var(--text-primary)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer" }}>
                    🎬 Vines ({viewingUserVines.length})
                  </button>
                </div>

                {profileTab === "posts" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {viewingUserPosts.length === 0 ? (
                      <p style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>No posts yet 📝</p>
                    ) : (
                      viewingUserPosts.map((post) => (
                        <div key={post._id} className="postCard">
                          <div className="postHeader">
                            <div className="userAvatar">
                              {post.authorId?.profilePicture ? (
                                <img src={`${API}${post.authorId.profilePicture}`} alt={post.authorId?.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : "👤"}
                            </div>
                            <div>
                              <p className="username">{post.authorId?.username || "Unknown"}</p>
                              <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                            </div>
                          </div>
                          <p className="postContent">{post.content}</p>
                          {post.picture && <div className="postPictureContainer"><img src={`${API}${post.picture}`} alt="Post" className="postPicture" /></div>}
                          <div className="postActions">
                            <button className="actionBtn likeBtn">❤️ {post.likes?.length || 0}</button>
                            <button className="actionBtn">💬 {post.comments?.length || 0}</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {profileTab === "vines" && (
                  <div>
                    {viewingUserVines.length === 0 ? (
                      <p style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>No vines yet 🎬</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
                        {viewingUserVines.map((vine) => (
                          <div key={vine._id} style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", background: "var(--bg-light)" }}>
                            <video width="100%" height="200" controls style={{ background: "#000" }}>
                              <source src={`${API}${vine.videoUrl}`} type="video/mp4" />
                            </video>
                            <div style={{ padding: "10px" }}>
                              <p style={{ margin: "0", fontSize: "14px", color: "var(--text-primary)" }}>{vine.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Profile not found.</p>
            )}
          </div>
        )}

      </main>
    </div>
  );
}