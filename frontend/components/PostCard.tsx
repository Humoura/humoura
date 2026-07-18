"use client";

import { useState } from "react";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  onUpdated: () => void;
  interactive?: boolean;
}

export default function PostCard({
  post,
  onUpdated,
  interactive = true,
}: PostCardProps) {
  const { token, userId, isAdmin } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [shareMenu, setShareMenu] = useState(false);
  const [postMenu, setPostMenu] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const likePost = async () => {
    try {
      await api.put(
        `/api/posts/like/${post._id}`,
        {},
        { headers: authHeaders(token) }
      );
      onUpdated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Like failed";
      alert(message);
    }
  };

  const commentPost = async () => {
    if (!newComment.trim()) return;
    try {
      await api.post(
        `/api/posts/comment/${post._id}`,
        { text: newComment },
        { headers: authHeaders(token) }
      );
      setNewComment("");
      onUpdated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Comment failed";
      alert(message);
    }
  };

  const deletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/api/posts/${post._id}`, {
        headers: authHeaders(token),
      });
      onUpdated();
      alert("Post deleted successfully!");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Delete failed";
      alert(message);
    }
  };

  const deleteComment = async (commentIdx: number) => {
    try {
      await api.delete(`/api/posts/${post._id}/comment/${commentIdx}`, {
        headers: authHeaders(token),
      });
      onUpdated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Delete failed";
      alert(message);
    }
  };

  const editPost = async () => {
    if (!editContent.trim()) return;
    try {
      await api.put(
        `/api/posts/${post._id}`,
        { content: editContent },
        { headers: authHeaders(token) }
      );
      setEditing(false);
      onUpdated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Edit failed";
      alert(message);
    }
  };

  const sharePost = async (shareType: string) => {
    try {
      await api.post(
        `/api/posts/${post._id}/share`,
        { shareType },
        { headers: authHeaders(token) }
      );
      setShareMenu(false);
      if (shareType === "feed") {
        onUpdated();
        alert("Post shared to your feed!");
      } else {
        alert("Post shared to user!");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Share failed";
      alert(message);
    }
  };

  const authorId =
    typeof post.authorId === "object" ? post.authorId?._id : post.authorId;
  const canManage = authorId === userId || isAdmin;

  return (
    <div className="postCard">
      <div className="postHeader">
        <div className="userAvatar">
          {post.authorId?.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(post.authorId.profilePicture)}
              alt={post.authorId?.username}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            "👤"
          )}
        </div>
        <div>
          <p className="username">{post.authorId?.username || "Unknown"}</p>
          <small>{new Date(post.createdAt).toLocaleDateString()}</small>
        </div>
      </div>
      <p className="postContent">{post.content}</p>
      {post.picture && (
        <div className="postPictureContainer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(post.picture)}
            alt="Post"
            className="postPicture"
          />
        </div>
      )}
      {interactive && (
        <>
          <div className="postActions">
            <button onClick={likePost} className="actionBtn likeBtn">
              ❤️ {post.likes?.length || 0}
            </button>
            <button
              className="actionBtn"
              onClick={() => setShowComments(!showComments)}
            >
              💬 {post.comments?.length || 0}
            </button>
            <button
              className="actionBtn"
              onClick={() => setShareMenu(!shareMenu)}
            >
              📤 Share
            </button>
            {canManage && (
              <div className="postMenuContainer">
                <button
                  className="postMenuBtn"
                  onClick={() => setPostMenu(!postMenu)}
                  title="More options"
                >
                  ⋯
                </button>
                {postMenu && (
                  <div className="postMenuDropdown">
                    {authorId === userId && (
                      <button
                        onClick={() => {
                          setEditing(true);
                          setEditContent(post.content);
                          setPostMenu(false);
                        }}
                        className="menuOption"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    {canManage && (
                      <button
                        onClick={() => {
                          deletePost();
                          setPostMenu(false);
                        }}
                        className="menuOption delete"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {shareMenu && (
            <div className="shareMenuBox">
              <button
                onClick={() => sharePost("feed")}
                className="shareOption"
              >
                📤 Share to Feed
              </button>
              <button
                onClick={() => setShareMenu(false)}
                className="shareOption"
              >
                👤 Share to User
              </button>
            </div>
          )}
          {editing && (
            <div className="editPostBox">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="postTextarea"
              />
              <button onClick={editPost} className="primaryBtn">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="secondaryBtn">
                Cancel
              </button>
            </div>
          )}
          {showComments && (
            <div className="commentsSection">
              <div className="commentsList">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment, idx) => {
                    const commentUser =
                      typeof comment.userId === "object"
                        ? comment.userId
                        : null;
                    const commentUserId =
                      typeof comment.userId === "object"
                        ? comment.userId?._id
                        : comment.userId;
                    const canDeleteComment =
                      isAdmin ||
                      commentUserId === userId ||
                      authorId === userId;
                    return (
                      <div key={idx} className="commentItem">
                        <div className="commentHeader">
                          <strong>
                            {commentUser?.username || "Unknown"}
                          </strong>
                          {canDeleteComment && (
                            <button
                              onClick={() => deleteComment(idx)}
                              className="deleteCommentBtn"
                              title="Delete comment"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <p>{comment.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="noComments">No comments yet</p>
                )}
              </div>
              <div className="addCommentBox">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button onClick={commentPost} className="commentBtn">
                  Post
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {!interactive && (
        <div className="postActions">
          <button className="actionBtn likeBtn">
            ❤️ {post.likes?.length || 0}
          </button>
          <button className="actionBtn">
            💬 {post.comments?.length || 0}
          </button>
        </div>
      )}
    </div>
  );
}
