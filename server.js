const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());
app.use(cors());

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
  password: String
});

const User = mongoose.model("User", userSchema);

// =========================
// POST MODEL
// =========================
const postSchema = new mongoose.Schema({
  content: String,
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);

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

    const user = await User.create({ username, email, password });

    res.json({ message: "User created", user });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// LOGIN
// =========================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.password !== password)
      return res.status(400).json({ message: "Wrong password" });

    res.json({
      message: "Login successful",
      token: "demo-token-" + user._id,
      user
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// CREATE POST
// =========================
app.post("/api/posts/create", async (req, res) => {
  try {
    const { content } = req.body;

    const user = await User.findOne();
    if (!user) return res.status(400).json({ message: "No user found" });

    const post = await Post.create({
      content,
      authorId: user._id
    });

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
      .populate("authorId", "username email")
      .populate("comments.userId", "username email")
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// LIKE POST
// =========================
app.put("/api/posts/like/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const user = await User.findOne();

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.likes.includes(user._id)) {
      post.likes.pull(user._id);
    } else {
      post.likes.push(user._id);
    }

    await post.save();

    res.json({ message: "Updated likes", post });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// COMMENT
// =========================
app.post("/api/posts/comment/:id", async (req, res) => {
  try {
    const { text } = req.body;

    const post = await Post.findById(req.params.id);
    const user = await User.findOne();

    post.comments.push({
      userId: user._id,
      text
    });

    await post.save();

    res.json({ message: "Comment added", post });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});