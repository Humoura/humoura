const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ""
  },
  profilePicture: {
    type: String,
    default: ""
  },
  coverPicture: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  settings: {
    publicProfile: { type: Boolean, default: true },
    allowMessagesFromFollowers: { type: Boolean, default: true },
    hideMyLikes: { type: Boolean, default: false },
    notifications: {
      postLikes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      followers: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);