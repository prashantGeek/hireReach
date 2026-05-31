import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const profileSchema = z.object({
  linkedinUrl: z.string().url().trim().nullable().or(z.literal("")),
  githubUrl: z.string().url().trim().nullable().or(z.literal("")),
  portfolioUrl: z.string().url().trim().nullable().or(z.literal("")),
  title: z.string().trim().min(2).max(100),
  yearsExperience: z.number().int().min(0).max(50),
  summary: z.string().trim().min(10),
  skillsJson: z.array(z.string().trim()),
  projectsJson: z.array(
    z.object({
      title: z.string().trim().min(2),
      description: z.string().trim().min(5),
      technologies: z.array(z.string().trim()),
    })
  ),
  location: z.string().trim().min(2),
  phone: z.string().trim().nullable().or(z.literal("")),
});

export const profileRouter = Router();

// Get profile
profileRouter.get("/profile", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Create or update profile
profileRouter.post("/profile", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid profile data", errors: parsed.error.flatten() });
    return;
  }

  const {
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    title,
    yearsExperience,
    summary,
    skillsJson,
    projectsJson,
    location,
    phone,
  } = parsed.data;

  try {
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null,
        portfolioUrl: portfolioUrl || null,
        title,
        yearsExperience,
        summary,
        skillsJson: skillsJson as any,
        projectsJson: projectsJson as any,
        location,
        phone: phone || null,
      },
      create: {
        userId,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null,
        portfolioUrl: portfolioUrl || null,
        title,
        yearsExperience,
        summary,
        skillsJson: skillsJson as any,
        projectsJson: projectsJson as any,
        location,
        phone: phone || null,
      },
    });

    res.status(200).json({ profile });
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({ message: "Failed to save profile" });
  }
});
