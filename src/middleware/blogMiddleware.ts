import { type Request, type Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default function blogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let token = req.headers.authorization?.split(" ")[1];
    let jwtPass = process.env.JWT_SECRET;
    if (!token) {
      res.status(401).json({
        msg: "No authorization headers",
      });
      return;
    }
    let decoded = jwt.verify(token, jwtPass!);
    let userEmail = (decoded as jwt.JwtPayload).email;
    // @ts-ignore
    req.user = userEmail;
    next();
  } catch (error) {
    res.status(500).json({
      msg:
        error instanceof Error
          ? error.message
          : "Somethign went wrong with the server",
    });
  }
}
