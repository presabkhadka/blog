import { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import { Multer } from "multer";
dotenv.config();
let jwtPass = process.env.JWT_SECRET;
import pool from "../db/db";
import { error } from "console";

export async function userSignup(req: Request, res: Response) {
  try {
    let { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({
        msg: "Input fields cannot be left empty",
      });
      return;
    }
    let conn = await pool.getConnection();
    try {
      let [userRows] = await conn.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if ((userRows as any[]).length > 0) {
        res.status(401).json({
          msg: "User already exists with such email",
        });
        return;
      }

      let hashedPassword = await bcrypt.hash(password, 10);

      await conn.execute(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hashedPassword]
      );

      res.status(200).json({
        msg: "User registered successfully",
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the serevr",
    });
  }
}

export async function userLogin(req: Request, res: Response) {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        msg: "Input fields cannot be left empty",
      });
    }
    let conn = await pool.getConnection();

    try {
      let [userRows] = await conn.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );

      if ((userRows as any[]).length === 0) {
        res.status(404).json({
          msg: "No such user found in our db",
        });
        return;
      }

      let user = (userRows as any[])[0];

      let passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        res.status(401).json({
          msg: "Invalid Credentials, Please try again later",
        });
        return;
      }

      let token = await jwt.sign({ email }, jwtPass!);

      res.status(200).json({
        token,
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the server at the moment",
    });
  }
}

export async function createBlog(req: Request, res: Response) {
  try {
    let { title, content } = req.body;
    let image = (req as Request & { file?: Express.Multer.File }).file
      ? `/uploads/${
          (req as Request & { file?: Express.Multer.File }).file!.filename
        }`
      : null;

    if (!title || !content || !image) {
      res.status(400).json({
        msg: "Input fields cannot be left empty",
      });
      return;
    }

    //   @ts-ignore
    let user = req.user;

    const conn = await pool.getConnection();

    try {
      const [userRows] = await conn.execute(
        "SELECT id FROM users WHERE email = ?",
        [user]
      );

      if ((userRows as any[]).length === 0) {
        res.status(404).json({
          msg: "User not found",
        });
        return;
      }

      let authorId = (userRows as any[])[0].id;

      let [existingBlogRows] = await conn.execute(
        "SELECT id FROM blogs WHERE title = ?",
        [title]
      );

      if ((existingBlogRows as any[]).length > 0) {
        res.status(409).json({
          msg: "Blog already exists with that title, Try editing it or deleting it",
        });
      }

      await conn.execute(
        "INSERT INTO blogs (title, content, image, author) VALUES (?, ?, ?, ?)",
        [title, content, image, authorId]
      );

      res.status(200).json({
        msg: "Blog created successfully",
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the server",
    });
  }
}

export async function fetchBlog(req: Request, res: Response) {
  try {
    let conn = await pool.getConnection();
    try {
      let [blogRows] = await conn.execute("SELECT * FROM blogs");

      if ((blogRows as any[]).length === 0) {
        res.status(404).json({
          msg: "No blogs found in our db",
        });
        return;
      }

      res.status(200).json({
        blogRows,
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the server",
    });
  }
}

export async function deleteBlog(req: Request, res: Response) {
  try {
    let { blogId } = req.params;
    if (!blogId) {
      res.status(400).json({
        msg: "No blog id found in params",
      });
      return;
    }

    let conn = await pool.getConnection();
    try {
      let [blogRoom] = await conn.execute("SELECT * FROM blogs WHERE id = ?", [
        blogId,
      ]);

      if ((blogRoom as any[]).length === 0) {
        res.status(404).json({
          msg: "No blogs found with such id in our db",
        });
        return;
      }

      await conn.execute("DELETE FROM blogs WHERE id = ?", [blogId]);

      res.status(200).json({
        msg: "Blog deleted successfully",
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the server",
    });
  }
}

export async function updateBlog(req: Request, res: Response) {
  try {
    let { blogId } = req.params;
    if (!blogId) {
      res.status(400).json({
        msg: "No blogId present in the params",
      });
      return;
    }

    let title = req.body?.title;
    let content = req.body?.content;
    let image = req.file ? `/uploads/${req.file.filename}` : null;

    let fieldsToUpdate: Record<string, any> = {};

    if (title) fieldsToUpdate.title = title;
    if (content) fieldsToUpdate.content = content;
    if (image) fieldsToUpdate.image = image;

    if (Object.keys(fieldsToUpdate).length === 0) {
      res.status(400).json({
        msg: "No fields to update",
      });
      return;
    }

    let conn = await pool.getConnection();

    try {
      let [blogRows] = await conn.execute("SELECT * FROM blogs WHERE id = ?", [
        blogId,
      ]);

      if ((blogRows as any[]).length === 0) {
        res.status(404).json({
          msg: "No such blogs with that id found in our db",
        });
        return;
      }
    } finally {
      conn.release();
    }

    const setClause = Object.keys(fieldsToUpdate)
      .map((field) => `${field} = ?`)
      .join(", ");

    const values = Object.values(fieldsToUpdate);

    await conn.execute(`UPDATE blogs SET ${setClause} WHERE id = ?`, [
      ...values,
      blogId,
    ]);

    res.status(200).json({
      msg: "Blog updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the server at the moment",
    });
  }
}
