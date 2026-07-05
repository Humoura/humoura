const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// =========================
// FILE UPLOAD CONFIG
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (req.path.includes("picture")) {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
      }
    }
    cb(null, true);
  }
});

// =========================
// DB CONNECT
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// =========================
// USER MODEL
// =========================
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePicture: String,
  coverPicture: String,
  bio: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  settings: {
    publicProfile: { type: Boolean, default: true },
    allowMessagesFromFollowers: { type: Boolean, default: true },
    hideMyLikes: { type: Boolean, default: false },
    notifications: {
      postLikes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      followers: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// =========================
// POST MODEL
// =========================
const postSchema = new mongoose.Schema({
  content: String,
  picture: String,
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  originalPostId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

// =========================
// VINE MODEL
// =========================
const vineSchema = new mongoose.Schema({
  videoUrl: String,
  description: { type: String, default: "" },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

const Vine = mongoose.model("Vine", vineSchema);

// =========================
// MESSAGE MODEL
// =========================
const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String,
  videoUrl: String,
  messageType: { type: String, enum: ["text", "video"], default: "text" }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

// =========================
// FRIEND REQUEST MODEL
// =========================
const friendRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
}, { timestamps: true });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

// =========================
// NOTIFICATION MODEL
// Fields: recipient, sender, type, message, isRead
// (unified — no more userId/fromUser confusion)
// =========================
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["follow", "like", "comment", "message"], default: "follow" },
  message: { type: String, default: "" },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

// =========================
// AUTH MIDDLEWARE
// =========================
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(401).json({ message: "No token" });
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// =========================
// POSITIVITY FILTER
// =========================
const negativeWords = ["bad", "hate", "worst", "horrible", "terrible", "disgusting", "ugly", "stupid", "dumb", "idiotic"];

const checkPositivity = (text) => {
  const lower = text.toLowerCase();
  return !negativeWords.some(word => lower.includes(word));
};

// =========================
// HOME
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Humoura API is running");
});

// =========================
// REGISTER
// =========================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      bio: "Welcome to Humoura! 😊",
      followers: [],
      following: [],
      settings: {
        publicProfile: true,
        allowMessagesFromFollowers: true,
        hideMyLikes: false,
        notifications: { postLikes: true, comments: true, messages: true, followers: true }
      }
    });
    res.json({ message: "User created", user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// LOGIN
// =========================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ id: "admin_user", isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "7d" });
      return res.json({
        message: "Admin login successful",
        token,
        user: { id: "admin_user", username: "admin_humoura", email: "admin@humoura.com", isAdmin: true }
      });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followers: user.followers.length,
        following: user.following.length
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET ALL USERS
// IMPORTANT: specific routes BEFORE /:id
// =========================
app.get("/api/users", auth, async (req, res) => {
  try {
    const users = await User.find()
      .select("_id username email profilePicture bio followers following")
      .populate("followers", "username")
      .populate("following", "username");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// SEARCH USERS
// MUST be before /api/users/:userId
// =========================
app.get("/api/users/search", auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.json([]);
    }

    const searchQuery = {
      $or: [
        { username: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } }
      ]
    };

    if (
      req.user.id &&
      mongoose.Types.ObjectId.isValid(req.user.id)
    ) {
      searchQuery._id = { $ne: req.user.id };
    }

    const users = await User.find(searchQuery)
      .select("username profilePicture bio followers following")
      .limit(10);

    res.json(users);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({
      message: "Search failed",
      error: err.message
    });
  }
});

// =========================
// GET PUBLIC PROFILE
// MUST be before /api/users/:userId
// =========================
app.get("/api/users/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === "admin_user") {
      return res.json({
        _id: "admin_user",
        username: "admin_humoura",
        email: "admin@humoura.com",
        profilePicture: "",
        coverPicture: "",
        bio: "Humoura Admin",
        followers: [],
        following: []
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);
  } catch (err) {
    console.error("USER PROFILE ERROR:", err);

    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

// =========================
// GET USER BY ID (own profile)
// =========================
app.get("/api/users/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password")
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// UPLOAD PROFILE PICTURE
// =========================
app.post("/api/users/profile-picture", auth, (req, res, next) => {
  upload.single("profilePicture")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "File upload failed" });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (req.user.isAdmin) {
      return res.json({ message: "Profile picture updated", profilePicture: `/uploads/${req.file.filename}`, success: true });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.profilePicture) {
      try {
        const oldPath = path.join(__dirname, "uploads", path.basename(user.profilePicture));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (e) { /* ignore */ }
    }
    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: "Profile picture updated", profilePicture: user.profilePicture, success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// UPLOAD COVER PICTURE
// =========================
app.post("/api/users/cover-picture", auth, (req, res, next) => {
  upload.single("coverPicture")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "File upload failed" });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (req.user.isAdmin) {
      return res.json({ message: "Cover picture updated", coverPicture: `/uploads/${req.file.filename}`, success: true });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.coverPicture) {
      try {
        const oldPath = path.join(__dirname, "uploads", path.basename(user.coverPicture));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (e) { /* ignore */ }
    }
    user.coverPicture = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: "Cover picture updated", coverPicture: user.coverPicture, success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// UPDATE BIO
// =========================
app.put("/api/users/bio", auth, async (req, res) => {
  try {
    const { bio } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { bio }, { new: true });
    res.json({ message: "Bio updated", bio: user.bio });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// UPDATE SETTINGS
// =========================
app.put("/api/users/settings", auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { settings }, { new: true });
    res.json({ message: "Settings updated", settings: user.settings });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// FOLLOW / UNFOLLOW USER
// =========================
app.post("/api/users/follow/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    if (userId === currentUserId) return res.status(400).json({ message: "Cannot follow yourself" });
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    const alreadyFollowing = currentUser.following.map(id => id.toString()).includes(userId);

    if (alreadyFollowing) {
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: userId } });
      await User.findByIdAndUpdate(userId, { $pull: { followers: currentUserId } });
      return res.json({ isFollowing: false, message: "Unfollowed successfully" });
    } else {
      await User.findByIdAndUpdate(currentUserId, { $push: { following: userId } });
      await User.findByIdAndUpdate(userId, { $push: { followers: currentUserId } });

      // Create follow notification (avoid duplicates)
      const exists = await Notification.findOne({ recipient: userId, sender: currentUserId, type: "follow" });
      if (!exists) {
        await Notification.create({
          recipient: userId,
          sender: currentUserId,
          type: "follow",
          message: "started following you",
          isRead: false
        });
      }
      return res.json({ isFollowing: true, message: "Followed successfully" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to update follow status" });
  }
});

// =========================
// GET USER POSTS
// =========================
app.get("/api/users/:userId/posts", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const posts = await Post.find({ authorId: userId })
      .populate("authorId", "username profilePicture")
      .populate("likes", "username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// =========================
// GET USER VINES
// =========================
app.get("/api/users/:userId/vines", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: "Invalid user ID" });
    const vines = await Vine.find({ authorId: userId })
      .populate("authorId", "username profilePicture")
      .sort({ createdAt: -1 });
    res.json(vines);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vines" });
  }
});

// =========================
// CREATE POST
// =========================
app.post("/api/posts/create", auth, (req, res, next) => {
  upload.single("picture")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "File upload failed" });
    next();
  });
}, async (req, res) => {
  try {
    const { content } = req.body;
    if (content && !checkPositivity(content)) {
      return res.status(400).json({ message: "Content must be positive! 🌟 Keep it humorous and friendly!" });
    }
    const post = await Post.create({
      content: content || "",
      picture: req.file ? `/uploads/${req.file.filename}` : null,
      authorId: req.user.id
    });
    await post.populate("authorId", "username email profilePicture");
    res.json({ message: "Post created", post });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET POSTS
// =========================
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("authorId", "username email profilePicture")
      .populate({ path: "comments.userId", select: "username profilePicture" })
      .populate({ path: "likes", select: "username" })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// LIKE POST
// =========================
app.put("/api/posts/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const userId = req.user.id;
    if (post.likes.map(id => id.toString()).includes(userId)) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    const updatedPost = await Post.findById(req.params.id)
      .populate("authorId", "username profilePicture")
      .populate({ path: "comments.userId", select: "username profilePicture" });
    res.json({ message: "Like updated", post: updatedPost });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// COMMENT ON POST
// =========================
app.post("/api/posts/comment/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!checkPositivity(text)) return res.status(400).json({ message: "Comments must be positive! Keep it friendly! 😊" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    post.comments.push({ userId: req.user.id, text });
    await post.save();
    const updatedPost = await Post.findById(req.params.id)
      .populate("authorId", "username profilePicture")
      .populate({ path: "comments.userId", select: "username profilePicture" });
    res.json({ message: "Comment added", post: updatedPost });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// DELETE COMMENT
// =========================
app.delete("/api/posts/:postId/comment/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const comment = post.comments[parseInt(req.params.commentId)];
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    const isAdmin = req.user.isAdmin || false;
    const isPostAuthor = post.authorId.toString() === req.user.id;
    const isCommentAuthor = comment.userId.toString() === req.user.id;
    if (!isAdmin && !isPostAuthor && !isCommentAuthor) return res.status(403).json({ message: "Not authorized" });
    post.comments = post.comments.filter((_, idx) => idx !== parseInt(req.params.commentId));
    await post.save();
    const updatedPost = await Post.findById(req.params.postId)
      .populate("authorId", "username profilePicture")
      .populate({ path: "comments.userId", select: "username profilePicture" });
    res.json({ message: "Comment deleted", post: updatedPost });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// EDIT POST
// =========================
app.put("/api/posts/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const isAdmin = req.user.isAdmin || false;
    if (post.authorId.toString() !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    if (req.body.content && !checkPositivity(req.body.content)) return res.status(400).json({ message: "Content must be positive!" });
    post.content = req.body.content || post.content;
    await post.save();
    const updatedPost = await Post.findById(req.params.id)
      .populate("authorId", "username profilePicture")
      .populate({ path: "comments.userId", select: "username profilePicture" });
    res.json({ message: "Post updated", post: updatedPost });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// DELETE POST
// =========================
app.delete("/api/posts/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    const isAdmin = req.user.isAdmin || false;
    if (post.authorId.toString() !== req.user.id && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// SHARE POST
// =========================
app.post("/api/posts/:id/share", auth, async (req, res) => {
  try {
    const { shareType, toUserId } = req.body;
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: "Post not found" });
    if (shareType === "feed") {
      const sharedPost = await Post.create({
        content: originalPost.content,
        picture: originalPost.picture,
        authorId: req.user.id,
        sharedBy: req.user.id,
        originalPostId: req.params.id
      });
      await sharedPost.populate("authorId", "username profilePicture");
      return res.json({ message: "Post shared to feed", post: sharedPost });
    } else if (shareType === "user" && toUserId) {
      originalPost.sharedWith.push(toUserId);
      await originalPost.save();
      return res.json({ message: "Post shared to user" });
    }
    res.status(400).json({ message: "Invalid share type" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET USER OWN POSTS
// =========================
app.get("/api/posts/user/:userId/own", auth, async (req, res) => {
  try {
    const posts = await Post.find({ authorId: req.params.userId, sharedBy: null })
      .populate("authorId", "username profilePicture")
      .populate({ path: "comments.userId", select: "username profilePicture" })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET USER SHARED POSTS
// =========================
app.get("/api/posts/user/:userId/shared", auth, async (req, res) => {
  try {
    const posts = await Post.find({
      $or: [{ sharedWith: req.params.userId }, { sharedBy: req.params.userId }]
    })
      .populate("authorId", "username profilePicture")
      .populate("sharedBy", "username profilePicture")
      .populate({ path: "comments.userId", select: "username profilePicture" })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// SEND MESSAGE
// =========================
app.post("/api/messages/send", auth, async (req, res) => {
  try {
    const { toUserId, text, videoUrl } = req.body;
    const sender = await User.findById(req.user.id);
    const receiver = await User.findById(toUserId);
    if (!receiver) return res.status(404).json({ message: "Recipient not found" });
    const isConnected = sender.following.map(id => id.toString()).includes(toUserId) &&
      receiver.following.map(id => id.toString()).includes(req.user.id);
    if (!isConnected) return res.status(403).json({ message: "You must be following each other to message" });
    const messageData = { from: req.user.id, to: toUserId, messageType: videoUrl ? "video" : "text" };
    if (text) messageData.text = text;
    if (videoUrl) messageData.videoUrl = videoUrl;
    const message = await Message.create(messageData);
    res.json({ message: "Message sent", data: message });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// UPLOAD MESSAGE VIDEO
// =========================
app.post("/api/messages/upload-video", auth, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ message: "Video uploaded", videoUrl: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// GET MESSAGES
// =========================
app.get("/api/messages/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user.id, to: req.params.userId },
        { from: req.params.userId, to: req.user.id }
      ]
    })
      .populate("from", "username profilePicture")
      .populate("to", "username profilePicture")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// CREATE VINE
// =========================
app.post("/api/vines/create", auth, (req, res, next) => {
  upload.single("video")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "File upload failed" });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Video file is required" });
    if (req.user.isAdmin) {
      return res.json({ message: "Vine created", vine: { videoUrl: `/uploads/${req.file.filename}`, description: req.body.description || "", authorId: req.user.id } });
    }
    const vine = await Vine.create({
      videoUrl: `/uploads/${req.file.filename}`,
      description: req.body.description || "",
      authorId: req.user.id
    });
    await vine.populate("authorId", "username profilePicture");
    res.json({ message: "Vine created", vine });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// =========================
// GET VINES
// =========================
app.get("/api/vines", auth, async (req, res) => {
  try {
    const vines = await Vine.find()
      .populate("authorId", "username profilePicture")
      .sort({ createdAt: -1 });
    res.json(vines);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// LIKE VINE
// =========================
app.put("/api/vines/like/:id", auth, async (req, res) => {
  try {
    const vine = await Vine.findById(req.params.id);
    if (!vine) return res.status(404).json({ message: "Vine not found" });
    if (vine.likes.map(id => id.toString()).includes(req.user.id)) {
      vine.likes = vine.likes.filter(id => id.toString() !== req.user.id);
    } else {
      vine.likes.push(req.user.id);
    }
    await vine.save();
    await vine.populate("authorId", "username profilePicture");
    res.json({ message: "Vine liked", vine });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// SEND FRIEND REQUEST
// =========================
app.post("/api/friends/request", auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    const existing = await FriendRequest.findOne({ from: req.user.id, to: toUserId });
    if (existing) return res.status(400).json({ message: "Request already sent" });
    const friendRequest = await FriendRequest.create({ from: req.user.id, to: toUserId, status: "pending" });
    res.json({ message: "Friend request sent", friendRequest });
  } catch (err) {
    res.status(500).json({ message: "Failed to send request" });
  }
});

// =========================
// ACCEPT FRIEND REQUEST
// =========================
app.post("/api/friends/accept", auth, async (req, res) => {
  try {
    const { fromUserId } = req.body;
    const friendRequest = await FriendRequest.findOneAndUpdate(
      { from: fromUserId, to: req.user.id, status: "pending" },
      { status: "accepted" },
      { new: true }
    );
    if (!friendRequest) return res.status(404).json({ message: "Request not found" });
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { following: fromUserId } });
    await User.findByIdAndUpdate(fromUserId, { $addToSet: { followers: req.user.id } });
    res.json({ message: "Friend request accepted", friendRequest });
  } catch (err) {
    res.status(500).json({ message: "Failed to accept request" });
  }
});

// =========================
// GET NOTIFICATIONS
// =========================
app.get("/api/notifications", auth, async (req, res) => {
  try {
    if (req.user.isAdmin) return res.json({ friendRequests: [], notifications: [] });
    const friendRequests = await FriendRequest.find({ to: req.user.id, status: "pending" })
      .populate("from", "username email profilePicture");
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate("sender", "username profilePicture")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({
      friendRequests,
      notifications,
      unreadCount: notifications.filter(n => !n.isRead).length
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// =========================
// MARK NOTIFICATION AS READ
// =========================
app.post("/api/notifications/:notificationId/read", auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notificationId)) return res.status(400).json({ message: "Invalid notification ID" });
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Marked as read", notification });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Humoura API running on http://localhost:${PORT}`);
});