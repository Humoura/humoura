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
// MONGODB CONNECT
// =========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// =========================
// USER MODEL (INLINE FOR SIMPLICITY)
// =========================
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

// =========================
// TEST ROUTE
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Humoura API is running");
});

// =========================
// LOGIN ROUTE (FIXED)
// =========================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // SIMPLE PASSWORD CHECK (NO BCRYPT FOR NOW)
    if (user.password !== password) {
      return res.status(400).json({ message: "Wrong password" });
    }

    res.json({
      message: "Login successful",
      token: "demo-token-" + user._id,
      user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// REGISTER ROUTE (SO YOU CAN CREATE USERS)
// =========================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      password
    });

    res.json({
      message: "User created successfully",
      user
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});