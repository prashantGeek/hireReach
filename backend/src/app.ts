import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { profileRouter } from "./routes/profile.js";
import { jobPostRouter } from "./routes/jobPost.js";
import { outreachRouter } from "./routes/outreach.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", profileRouter);
app.use("/api", jobPostRouter);
app.use("/api", outreachRouter);

// Global error-handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction,
  ) => {
    console.error("Unhandled API Error:", err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      message: err.message || "An unexpected server error occurred.",
      ...(env.NODE_ENV === "development" ? { error: err.stack || err } : {}),
    });
  },
);

