"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const blogRoutes_1 = require("./routes/blogRoutes");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
let port = process.env.PORT;
let app = (0, express_1.default)();
let limiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    limit: 15,
    standardHeaders: "draft-8",
    legacyHeaders: false,
});
app.use(express_1.default.json());
app.use(limiter);
app.use((0, cors_1.default)());
app.use("/blog", blogRoutes_1.blogRouter);
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
