import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [posts, setPosts] = useState([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [content, setContent] = useState("");

  const [editText, setEditText] = useState({});
  const [commentText, setCommentText] = useState({});

  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;

  // LOGIN
  const login = async () => {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password
    });

    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);

    fetchPosts();
  };

  // LOGOUT
  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setPosts([]);
  };

  // FETCH
  const fetchPosts = async () => {
    const res = await axios.get("http://localhost:5000/api/posts");
    setPosts(res.data);
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  // CREATE
  const createPost = async () => {
    await axios.post(
      "http://localhost:5000/api/posts/create",
      { content },
      { headers: { Authorization: token } }
    );

    setContent("");
    fetchPosts();
  };

  // LIKE
  const likePost = async (id) => {
    await axios.put(
      `http://localhost:5000/api/posts/like/${id}`,
      {},
      { headers: { Authorization: token } }
    );

    fetchPosts();
  };

  // COMMENT
  const addComment = async (id) => {
    await axios.post(
      `http://localhost:5000/api/posts/comment/${id}`,
      { text: commentText[id] },
      { headers: { Authorization: token } }
    );

    setCommentText({ ...commentText, [id]: "" });
    fetchPosts();
  };

  // EDIT
  const editPost = async (id) => {
    await axios.put(
      `http://localhost:5000/api/posts/${id}`,
      { content: editText[id] },
      { headers: { Authorization: token } }
    );

    fetchPosts();
  };

  // DELETE
  const deletePost = async (id) => {
    await axios.delete(
      `http://localhost:5000/api/posts/${id}`,
      { headers: { Authorization: token } }
    );

    fetchPosts();
  };

  // LOGIN SCREEN
  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>

        <input placeholder="email" onChange={e => setEmail(e.target.value)} />
        <input placeholder="password" type="password" onChange={e => setPassword(e.target.value)} />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>🔥 Humoura Feed</h2>

      <button onClick={logout}>Logout</button>

      <hr />

      {/* CREATE */}
      <textarea value={content} onChange={e => setContent(e.target.value)} />
      <button onClick={createPost}>Post</button>

      {/* POSTS */}
      {posts.map(post => {
        const isOwner = post.authorId._id === user.id;

        return (
          <div key={post._id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
            <b>{post.authorId.username}</b>

            <p>{post.content}</p>

            <button onClick={() => likePost(post._id)}>
              ❤️ {post.likes.length}
            </button>

            {/* OWNER CONTROLS */}
            {isOwner && (
              <div>
                <input
                  placeholder="edit post"
                  value={editText[post._id] || ""}
                  onChange={e =>
                    setEditText({ ...editText, [post._id]: e.target.value })
                  }
                />

                <button onClick={() => editPost(post._id)}>Edit</button>
                <button onClick={() => deletePost(post._id)}>Delete</button>
              </div>
            )}

            {/* COMMENTS */}
            <div>
              <h4>Comments</h4>

              {post.comments?.map(c => (
                <p key={c._id}>
                  <b>{c.userId.username}:</b> {c.text}
                </p>
              ))}

              <input
                placeholder="comment"
                value={commentText[post._id] || ""}
                onChange={e =>
                  setCommentText({
                    ...commentText,
                    [post._id]: e.target.value
                  })
                }
              />

              <button onClick={() => addComment(post._id)}>
                Send
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default App;