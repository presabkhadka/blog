import rateLimit from "express-rate-limit";

export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 15,
  legacyHeaders: false,
  standardHeaders: "draft-8",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  legacyHeaders: false,
  standardHeaders: "draft-8",
});
