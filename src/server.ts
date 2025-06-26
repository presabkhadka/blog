import dotenv from "dotenv";
import express from "express";
import { blogRouter } from "./routes/blog.route";
import cors from "cors";
import path from "path";

dotenv.config();

let port = process.env.PORT;
let app = express();

app.use(express.json());
app.use(cors());
app.use("/blog", blogRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
