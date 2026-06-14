import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { summarizeProfile, analyzeMatch, generateEmailOutreach } from "../lib/openai.js";
import { sendEmail } from "../lib/mailer.js";

const generateSchema = z.object({
  jobPostId: z.string().min(1),
});

const sendSchema = z.object({
  outreachEmailId: z.string().min(1),
  recipientEmail: z.string().email().trim(),
  subject: z.string().trim().min(5),
  htmlContent: z.string().trim().min(20),
});

export const outreachRouter = Router();

// 1. Generate Outreach Email Draft + Match Score
outreachRouter.post("/outreach/generate", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request data", errors: parsed.error.flatten() });
    return;
  }

  const { jobPostId } = parsed.data;

  try {
    // A. Fetch JobPost
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
    });

    if (!jobPost) {
      res.status(404).json({ message: "Job post not found" });
      return;
    }

    // B. Fetch Profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      res.status(400).json({ message: "Please complete your professional profile before generating outreach" });
      return;
    }

    // C. Multi-Step AI Generation Flow
    // Step 1: Summarize Candidate Profile
    const profileSummary = await summarizeProfile(profile);

    // Step 2: Compare & Analyze Match
    const matchAnalysis = await analyzeMatch(profileSummary, jobPost.extractedJson as any);

    // Step 3: Generate Email Subject + HTML Body
    const generatedEmail = await generateEmailOutreach(
      jobPost.extractedJson as any,
      profileSummary,
      matchAnalysis
    );

    // D. Save OutreachEmail as a Draft
    const recipientEmail = (jobPost.extractedJson as any).company_email || "";

    const outreachEmail = await prisma.outreachEmail.create({
      data: {
        userId,
        jobPostId,
        recipientEmail,
        subject: generatedEmail.subject,
        htmlContent: generatedEmail.content,
        status: "draft",
      },
    });

    // E. Create Audit Log for Info
    await prisma.auditLog.create({
      data: {
        userId,
        action: "GENERATE_OUTREACH",
        details: `Generated email draft for job post ${jobPostId}. Match score: ${matchAnalysis.match_score}`,
        status: "SUCCESS",
      },
    });

    res.status(201).json({
      message: "Outreach email draft generated successfully",
      outreachEmailId: outreachEmail.id,
      matchScore: matchAnalysis.match_score,
      matchedSkills: matchAnalysis.matched_skills,
      matchedExperiencePoints: matchAnalysis.matched_experience_points,
      missingOrWeakAreas: matchAnalysis.missing_or_weak_areas,
      recommendedTalkingPoints: matchAnalysis.recommended_talking_points,
      emailDraft: {
        recipientEmail,
        subject: outreachEmail.subject,
        htmlContent: outreachEmail.htmlContent,
      },
    });
  } catch (error) {
    console.error("Error generating outreach:", error);
    res.status(500).json({ message: "Failed to generate outreach email draft" });
  }
});

// 2. Send Outreach Email
outreachRouter.post("/outreach/send", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request data", errors: parsed.error.flatten() });
    return;
  }

  const { outreachEmailId, recipientEmail, subject, htmlContent } = parsed.data;

  try {
    const outreachEmail = await prisma.outreachEmail.findUnique({
      where: { id: outreachEmailId },
    });

    if (!outreachEmail || outreachEmail.userId !== userId) {
      res.status(404).json({ message: "Outreach email draft not found" });
      return;
    }

    try {
      // Send the email via Nodemailer
      const mailResult = await sendEmail({
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      // Update OutreachEmail record
      await prisma.outreachEmail.update({
        where: { id: outreachEmailId },
        data: {
          recipientEmail,
          subject,
          htmlContent,
          status: "sent",
          providerMessageId: mailResult.messageId,
          sentAt: new Date(),
        },
      });

      // Log success audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SEND_OUTREACH",
          details: `Sent email to ${recipientEmail}. Subject: "${subject}". Preview: ${mailResult.previewUrl || "N/A"}`,
          status: "SUCCESS",
        },
      });

      res.status(200).json({
        message: "Email sent successfully!",
        previewUrl: mailResult.previewUrl || undefined,
      });
    } catch (sendError: any) {
      console.error("Mailer failed to send:", sendError);

      // Update OutreachEmail status to failed
      await prisma.outreachEmail.update({
        where: { id: outreachEmailId },
        data: {
          recipientEmail,
          subject,
          htmlContent,
          status: "failed",
        },
      });

      // Log failed audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: "SEND_OUTREACH",
          details: `Failed to send email to ${recipientEmail}. Error: ${sendError.message || sendError}`,
          status: "FAILURE",
        },
      });

      res.status(500).json({
        message: "Failed to send email via mail server. Draft saved as failed.",
        error: sendError.message || String(sendError),
      });
    }
  } catch (error) {
    console.error("Error in outreach send endpoint:", error);
    res.status(500).json({ message: "Failed to process send request" });
  }
});

// 3. Get Outreach History
outreachRouter.get("/outreach/history", requireAuth, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const history = await prisma.outreachEmail.findMany({
      where: { userId },
      include: {
        jobPost: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ history });
  } catch (error) {
    console.error("Error loading history:", error);
    res.status(500).json({ message: "Failed to load outreach history" });
  }
});

// 4. Get a single outreach email details
outreachRouter.get("/outreach/:id", requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const outreach = await prisma.outreachEmail.findFirst({
      where: { id: id as string, userId },
      include: {
        jobPost: true,
      },
    });

    if (!outreach) {
      res.status(404).json({ message: "Outreach email draft not found" });
      return;
    }

    res.status(200).json({ outreach });
  } catch (error) {
    console.error("Error retrieving outreach email details:", error);
    res.status(500).json({ message: "Failed to load outreach email details" });
  }
});

