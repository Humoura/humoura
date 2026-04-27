import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://humoura.onrender.com";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);

  // =========================
  // LOGIN
  // =========================
  const login = async () => {
    try {
      setLoading(true);

      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);

      await fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  // =========================
  // FETCH POSTS
  // =========================
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/api/posts`);
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("Fetch posts error:", err);
      setPosts([]);
    }
  };

  // =========================
  // CREATE POST
  // =========================
  const createPost = async () => {
    if (!content.trim()) return;

    try {
      await axios.post(`${API}/api/posts/create`, {
        content,
      });

      setContent("");
      await fetchPosts();
    } catch (err) {
      alert("Post failed");
    }
  };

  // =========================
  // LOAD POSTS
  // =========================
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>🚀 Humoura</h1>

      {!token ? (
        <div style={{ marginBottom: "30px" }}>
          <h3>Login</h3>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%", padding: "10px" }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", marginBottom: "10px", width: "100%", padding: "10px" }}
          />

          <button onClick={login} disabled={loading} style={{ padding: "10px 20px" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
            <h3>Create Post</h3>
            <button onClick={logout}>Logout</button>
          </div>

          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="4"
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />

          <button onClick={createPost} style={{ padding: "10px 20px" }}>
            Post
          </button>
        </div>
      )}

      <h2>Feed</h2>

      {posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((post) => (
          <div
            key={post._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "10px",
            }}
          >
            <strong>{post.authorId?.username || "Unknown User"}</strong>
            <p style={{ marginTop: "10px" }}>{post.content}</p>
            <small>❤️ {post.likes?.length || 0}</small>

            {post.comments?.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <strong>Comments:</strong>
                {post.comments.map((comment) => (
                  <div key={comment._id} style={{ marginTop: "5px", paddingLeft: "10px" }}>
                    <small>
                      <b>{comment.userId?.username || "User"}:</b> {comment.text}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}