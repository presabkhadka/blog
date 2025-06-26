import { type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { Blog, User } from "../db/db";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fs from "fs";
import { Multer } from "multer";
dotenv.config();
let jwtPass = process.env.JWT_SECRET;

export async function userSignup(req: Request, res: Response) {
  try {
    let { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({
        msg: "Input fields cannot be left empty",
      });
      return;
    }
    let hashedPass = await bcrypt.hash(password, 10);

    let existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      res.status(409).json({
        msg: "User already exists with such email",
      });
      return;
    }

    await User.create({
      username,
      email,
      password: hashedPass,
    });
    res.status(200).json({
      msg: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the server",
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
      return;
    }

    let existingUser = await User.findOne({
      email,
    });

    if (!existingUser) {
      res.status(404).json({
        msg: "No such user found in our db",
      });
      return;
    }

    let passwordMatch = await bcrypt.compare(
      password,
      existingUser.password as string
    );

    if (!passwordMatch) {
      res.status(400).json({
        msg: "Incorrect credentials, Please try again",
      });
      return;
    }

    let token = await jwt.sign({ email }, jwtPass!);

    res.status(200).json({
      msg: token,
    });
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Something went wrong with the server",
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
    //   @ts-ignore
    let user = req.user;
    console.log("🚀 ~ createBlog ~ user:", user);

    let userExist = await User.findOne({
      email: user,
    });

    let authorId = userExist?._id;

    if (!title || !content || !image) {
      res.status(400).json({
        msg: "Input fields cannot be left empty",
      });
      return;
    }

    let existingBlog = await Blog.findOne({
      title,
    });

    if (existingBlog) {
      res.status(409).json({
        msg: "Blog already exists with that title, Try editing it or deleting it",
      });
      return;
    }

    await Blog.create({
      title,
      content,
      author: authorId,
      image,
    });
    res.status(200).json({
      msg: "Blog created successfully",
    });
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
    let blogs = await Blog.find({});
    if (blogs.length === 0) {
      res.status(404).json({
        msg: "No blogs present in our db",
      });
      return;
    }
    res.status(200).json({
      blogs,
    });
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
        msg: "No blog id present in the params",
      });
      return;
    }

    let blogExists = await Blog.findOne({
      _id: blogId,
    });

    if (!blogExists) {
      res.status(404).json({
        msg: "No such blog found in our db",
      });
      return;
    }

    await Blog.deleteOne({
      _id: blogId,
    });
    res.status(200).json({
      msg: "Blog deleted successfully",
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

export async function updateBlog(req: Request, res: Response) {
  try {
    let { blogId } = req.params;
    if (!blogId) {
      res.status(400).json({
        msg: "No blogId present in the params",
      });
      return;
    }
    let blogExists = await Blog.findOne({
      _id: blogId,
    });

    if (!blogExists) {
      res.status(404).json({
        msg: "No blog exists with such id in our db",
      });
      return;
    }

    let { title = undefined, content = undefined } = req.body as Record<
      string,
      any
    >;

    let image = req.file ? `/uploads/${req.file.filename}` : null;

    const fieldsToUpdate: Record<string, any> = {};

    if (title) fieldsToUpdate.title = title;
    if (content) fieldsToUpdate.content = content;
    if (image) fieldsToUpdate.image = image

    if (Object.keys(fieldsToUpdate).length === 0) {
      res.status(400).json({
        msg: "No fields to update",
      });
      return;
    }

    let result = await Blog.updateOne(
      {
        _id: blogId,
      },
      { $set: fieldsToUpdate }
    );

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
 
