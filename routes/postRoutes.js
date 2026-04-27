const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  likePost,
  addComment
} = require("../controllers/postController");

router.get("/", getPosts);

router.post("/create", auth, createPost);

router.put("/:id", auth, updatePost);      // ✏️ edit
router.delete("/:id", auth, deletePost);   // 🗑 delete

router.put("/like/:id", auth, likePost);

router.post("/comment/:id", auth, addComment);

module.exports = router;