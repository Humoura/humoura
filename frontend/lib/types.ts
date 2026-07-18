export interface UserSettings {
  publicProfile?: boolean;
  allowMessagesFromFollowers?: boolean;
  hideMyLikes?: boolean;
  notifications?: {
    postLikes?: boolean;
    comments?: boolean;
    messages?: boolean;
    followers?: boolean;
  };
}

export interface User {
  _id: string;
  username: string;
  email?: string;
  bio?: string;
  profilePicture?: string;
  coverPicture?: string;
  followers?: (string | User)[];
  following?: (string | User)[];
  settings?: UserSettings;
  isAdmin?: boolean;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
}

export interface Comment {
  text: string;
  userId?: User | string;
  createdAt?: string;
}

export interface Post {
  _id: string;
  content: string;
  picture?: string;
  authorId?: User;
  likes?: string[];
  comments?: Comment[];
  createdAt: string;
}

export interface Vine {
  _id: string;
  videoUrl: string;
  description?: string;
  authorId?: User;
  likes?: string[];
  comments?: Comment[];
  createdAt?: string;
}

export interface Message {
  _id?: string;
  from: string;
  to?: string;
  text?: string;
  videoUrl?: string;
  messageType?: "text" | "video";
  createdAt?: string;
}

export interface Notification {
  _id: string;
  message: string;
  type?: string;
  isRead: boolean;
  sender?: User;
  createdAt: string;
}

export interface FriendRequest {
  _id: string;
  from: string;
  fromUser?: User;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  isAdmin?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}
