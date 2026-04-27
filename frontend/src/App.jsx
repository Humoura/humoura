import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://humoura.onrender.com";

function App() {
  const [posts, setPosts] = useState([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [content, setContent] = useState("");
  const [commentText, setCommentText] = useState({});

  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;

  // LOGIN
  const login = async () => {
    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password
      });

      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);

      fetchPosts();

    } catch (err) {
      console.log(err);
    }
  };

  // LOGOUT
  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setPosts([]);
  };

  // FETCH POSTS
  const fetchPosts = async () => {
    const res = await axios.get(`${API}/api/posts`);
    setPosts(res.data);
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  // CREATE POST
  const createPost = async () => {
    await axios.post(
      `${API}/api/posts/create`,
      { content },
      { headers: { Authorization: token } }
    );

    setContent("");
    fetchPosts();
  };

  // LIKE POST
  const likePost = async (id) => {
    await axios.put(
      `${API}/api/posts/like/${id}`,
      {},
      { headers: { Authorization: token } }
    );

    fetchPosts();
  };

  // COMMENT
  const addComment = async (id) => {
    await axios.post(
      `${API}/api/posts/comment/${id}`,
      { text: commentText[id] },
      { headers: { Authorization: token } }
    );

    setCommentText({ ...commentText, [id]: "" });
    fetchPosts();
  };

  // LOGIN SCREEN
  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>🔥 Humoura Login</h2>

        <input
          placeholder="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>

      <h2>🔥 Humoura Feed</h2>

      <button onClick={logout}>Logout</button>

      <hr />

      {/* CREATE POST */}
      <textarea
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={createPost}>Post</button>

      {/* POSTS */}
      {posts.map((post) => (
        <div
          key={post._id}
          style={{
            border: "1px solid #ddd",
            padding: 10,
            marginTop: 10
          }}
        >
          <b>{post.authorId.username}</b>

          <p>{post.content}</p>

          <button onClick={() => likePost(post._id)}>
            ❤️ {post.likes.length}
          </button>

          {/* COMMENTS */}
          <div>
            <h4>Comments</h4>

            {post.comments?.map((c) => (
              <p key={c._id}>
                <b>{c.userId.username}:</b> {c.text}
              </p>
            ))}

            <input
              placeholder="comment..."
              value={commentText[post._id] || ""}
              onChange={(e) =>
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
      ))}
    </div>
  );
}

export default App;