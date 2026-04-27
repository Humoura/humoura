const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors({
  origin: "*"
}));

app.use(express.json());

// =====================
// ROUTES
// =====================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));

// =====================
// HEALTH CHECK ROUTE
// =====================
app.get("/", (req, res) => {
  res.send("🚀 Humoura API is running");
});

// =====================
// DATABASE CONNECT
// =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error:", err));

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});