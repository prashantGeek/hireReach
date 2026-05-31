import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { extractHiringPost } from "../lib/openai.js";

const extractSchema = z.object({
  rawText: z.string().trim().min(20),
  sourceUrl: z.string().url().trim().optional().or(z.literal("")),
});

export const jobPostRouter = Router();

// Extract job post details
jobPostRouter.post("/job-post/extract", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsed = extractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request data", errors: parsed.error.flatten() });
    return;
  }

  const { rawText, sourceUrl } = parsed.data;

  try {
    // 1. Call OpenAI parser to extract structured fields
    const extractedData = await extractHiringPost(rawText);

    // 2. Store the raw text and extracted json in the database
    const jobPost = await prisma.jobPost.create({
      data: {
        userId,
        sourceUrl: sourceUrl || null,
        rawText,
        extractedJson: extractedData as any,
      },
    });

    res.status(201).json({
      message: "Job post details extracted successfully",
      jobPostId: jobPost.id,
      extractedDetails: extractedData,
    });
  } catch (error) {
    console.error("Error extracting job post:", error);
    res.status(500).json({ message: "Failed to extract job post details" });
  }
});

// List all past job posts
jobPostRouter.get("/job-post", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const jobPosts = await prisma.jobPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ jobPosts });
  } catch (error) {
    console.error("Error listing job posts:", error);
    res.status(500).json({ message: "Failed to load job posts" });
  }
});
