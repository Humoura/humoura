const Post = require("../models/Post");

// CREATE
const createPost = async (req, res) => {
  try {
    const { content } = req.body;

    const post = await Post.create({
      content,
      authorId: req.user.id
    });

    const populated = await Post.findById(post._id).populate(
      "authorId",
      "username email"
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL
const getPosts = async (req, res) => {
  const posts = await Post.find()
    .populate("authorId", "username email")
    .populate("comments.userId", "username email")
    .sort({ createdAt: -1 });

  res.json(posts);
};

// UPDATE POST (✏️ NEW)
const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Not found" });

    if (post.authorId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    post.content = req.body.content;
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE POST (🗑 NEW)
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Not found" });

    if (post.authorId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    await post.deleteOne();

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LIKE
const likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  const userId = req.user.id;

  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id.toString() !== userId);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  res.json(post);
};

// COMMENT
const addComment = async (req, res) => {
  const post = await Post.findById(req.params.id);

  post.comments.push({
    userId: req.user.id,
    text: req.body.text
  });

  await post.save();

  res.json(post);
};

module.exports = {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  likePost,
  addComment
};