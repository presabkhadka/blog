import { Router } from "express";
import {
  createBlog,
  deleteBlog,
  fetchBlog,
  updateBlog,
  userLogin,
  userSignup,
} from "../controller/blogController";
import blogMiddleware from "../middleware/blogMiddleware";
import { authLimiter } from "../config/rateLimiter";
import { generalLimiter } from "../config/rateLimiter";
let blogRouter = Router();
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files and pdf files are allowed!"));
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

blogRouter.post("/signup", authLimiter, userSignup);
blogRouter.post("/login", authLimiter, userLogin);
blogRouter.post(
  "/add-blog",
  blogMiddleware,
  generalLimiter,
  upload.single("image"),
  createBlog
);
blogRouter.get("/blog", generalLimiter, fetchBlog);
blogRouter.delete("/delete/:blogId", generalLimiter, deleteBlog);
blogRouter.patch("/update/:blogId", generalLimiter, updateBlog);

export { blogRouter };
