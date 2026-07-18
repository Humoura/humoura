"use client";

import { useState } from "react";
import { api, authHeaders, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
interface CreatePostBoxProps {
  profilePicture?: string;
  onCreated: () => void;
}

export default function CreatePostBox({
  profilePicture,
  onCreated,
}: CreatePostBoxProps) {
  const { token, username } = useAuth();
  const [content, setContent] = useState("");
  const [postPictureFile, setPostPictureFile] = useState<File | null>(null);

  const createPost = async () => {
    if (!content.trim() && !postPictureFile) {
      alert("Please add text or a picture");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (postPictureFile) formData.append("picture", postPictureFile);
      await api.post("/api/posts/create", formData, {
        headers: authHeaders(token),
      });
      setContent("");
      setPostPictureFile(null);
      onCreated();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Post failed";
      alert(message);
    }
  };

  return (
    <div className="createPostBox">
      <div className="postHeader">
        <div className="userAvatar">
          {profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl(profilePicture)}
              alt={username}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            "👤"
          )}
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
        <label htmlFor="postPictureInput" className="uploadBtn" title="Add picture">
          📷 Picture
        </label>
        <input
          id="postPictureInput"
          type="file"
          accept="image/*"
          onChange={(e) => setPostPictureFile(e.target.files?.[0] || null)}
          style={{ display: "none" }}
        />
        {postPictureFile && (
          <span className="fileSelected">✓ {postPictureFile.name}</span>
        )}
      </div>
      {postPictureFile && (
        <div className="picturePreview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(postPictureFile)} alt="Preview" />
        </div>
      )}
      <button onClick={createPost} className="primaryBtn">
        Post ✨
      </button>
    </div>
  );
}
