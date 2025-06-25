import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
let user = process.env.DB_USER;
let pass = process.env.DB_PW;

mongoose.connect(
  `mongodb+srv://${user}:${pass}@cluster0.g6wpo.mongodb.net/blog`
);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  image: String,
});

export const User = mongoose.model("User", userSchema);
export const Blog = mongoose.model("Blog", blogSchema);

module.exports = {
  User,
  Blog,
};
