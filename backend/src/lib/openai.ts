import OpenAI from "openai";
import { env } from "../config/env.js";

// Initialize OpenAI client lazily
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: env.OPENAI_API_KEY === "placeholder_key_replace_me" ? "dummy_openai_key_for_testing" : env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// 1. Hiring Post Extraction
export interface ExtractedPost {
  company_email: string;
  role: string;
  company_or_recruiter_name: string;
  required_skills: string[];
  experience_required: string;
  job_type: string;
  location: string;
  responsibilities: string[];
  notes: string;
}

export async function extractHiringPost(postText: string): Promise<ExtractedPost> {
  const client = getOpenAIClient();
  
  const systemPrompt = `You extract structured hiring information from job or freelance hiring posts.
Return only valid JSON.
Do not include markdown.
Do not invent missing details.
If a field is not present, return an empty string or empty array.`;

  const userPrompt = `Extract structured hiring information from the following post.
Return only JSON in this format:
{
  "company_email": "",
  "role": "",
  "company_or_recruiter_name": "",
  "required_skills": [],
  "experience_required": "",
  "job_type": "",
  "location": "",
  "responsibilities": [],
  "notes": ""
}

Rules:
- Extract email only if explicitly present in the text (look for "@" symbols)
- Normalize skills into short clear terms (e.g. "React" instead of "React.js developer")
- Keep responsibilities as short bullet-like strings
- Do not guess company name unless clearly stated

POST TEXT:
${postText}`;

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text) as ExtractedPost;
  } catch (error) {
    console.error("OpenAI post extraction failed:", error);
    // Fallback if key is missing or call fails
    return {
      company_email: extractEmailRegex(postText),
      role: "Software Engineer",
      company_or_recruiter_name: "",
      required_skills: [],
      experience_required: "",
      job_type: "",
      location: "",
      responsibilities: [],
      notes: "Extraction fallback used."
    };
  }
}

// Helper to extract email with regex as fallback
function extractEmailRegex(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : "";
}

// 2. Profile Summarization
export interface ProfileSummary {
  candidate_name: string;
  candidate_title: string;
  years_experience: string;
  top_skills: string[];
  domain_experience: string[];
  project_highlights: string[];
  professional_summary: string;
}

export async function summarizeProfile(profileData: any): Promise<ProfileSummary> {
  const client = getOpenAIClient();

  const systemPrompt = `You summarize technical candidate profiles for job matching.
Return only valid JSON.
Do not exaggerate or invent experience.
Use only the provided input.`;

  const userPrompt = `Summarize this candidate profile into structured JSON.
Return only JSON in this format:
{
  "candidate_name": "",
  "candidate_title": "",
  "years_experience": "",
  "top_skills": [],
  "domain_experience": [],
  "project_highlights": [],
  "professional_summary": ""
}

CANDIDATE PROFILE:
${JSON.stringify(profileData, null, 2)}`;

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text) as ProfileSummary;
  } catch (error) {
    console.error("OpenAI profile summarization failed:", error);
    return {
      candidate_name: profileData.fullName || "",
      candidate_title: profileData.title || "",
      years_experience: String(profileData.yearsExperience || ""),
      top_skills: Array.isArray(profileData.skillsJson) ? profileData.skillsJson : [],
      domain_experience: [],
      project_highlights: Array.isArray(profileData.projectsJson) 
        ? profileData.projectsJson.map((p: any) => typeof p === "string" ? p : p.title || "") 
        : [],
      professional_summary: profileData.summary || ""
    };
  }
}

// 3. Match Analysis
export interface MatchAnalysis {
  match_score: number;
  matched_skills: string[];
  matched_experience_points: string[];
  missing_or_weak_areas: string[];
  recommended_talking_points: string[];
}

export async function analyzeMatch(
  profileSummary: ProfileSummary,
  extractedPost: ExtractedPost
): Promise<MatchAnalysis> {
  const client = getOpenAIClient();

  const systemPrompt = `You compare a candidate profile with a hiring post.
Return only valid JSON.
Do not invent qualifications.
Focus on overlap between the role requirements and the candidate profile.`;

  const userPrompt = `Compare the candidate profile and the hiring post.
Return only JSON in this format:
{
  "match_score": 0,
  "matched_skills": [],
  "matched_experience_points": [],
  "missing_or_weak_areas": [],
  "recommended_talking_points": []
}

Rules:
- match_score must be an integer from 0 to 100
- recommended_talking_points should be concise and recruiter-friendly
- Do not mention missing areas unless they are clearly important

CANDIDATE PROFILE:
${JSON.stringify(profileSummary, null, 2)}

HIRING POST:
${JSON.stringify(extractedPost, null, 2)}`;

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text) as MatchAnalysis;
  } catch (error) {
    console.error("OpenAI match analysis failed:", error);
    return {
      match_score: 70,
      matched_skills: [],
      matched_experience_points: [],
      missing_or_weak_areas: [],
      recommended_talking_points: ["Highlight extensive experience in core stack"]
    };
  }
}

// 4. Email Subject & HTML body Generation
export interface GeneratedEmail {
  subject: string;
  content: string;
}

export async function generateEmailOutreach(
  extractedPost: ExtractedPost,
  profileSummary: ProfileSummary,
  matchAnalysis: MatchAnalysis
): Promise<GeneratedEmail> {
  const client = getOpenAIClient();

  const systemPrompt = `You generate concise professional outreach emails for freelance or job opportunities.
Return only valid JSON.
Do not include markdown.
Do not invent achievements.
Use only provided inputs.
The output must be ready for use in an email sending system.`;

  const userPrompt = `Generate a personalized recruiter outreach email.
Return only JSON in this format:
{
  "subject": "",
  "content": ""
}

Rules:
- content must be valid HTML
- Use only these HTML tags: <h2>, <p>, <ul>, <li>, <strong>, <a>
- Keep the email under 200 words
- Tone must be concise, authentic, and professional
- Mention only skills and experience supported by the candidate data
- If recruiter name exists, greet them by name
- If recruiter name does not exist, use a generic greeting
- The email should express interest, highlight relevant fit, and end with a call to connect

HIRING POST:
${JSON.stringify(extractedPost, null, 2)}

CANDIDATE PROFILE:
${JSON.stringify(profileSummary, null, 2)}

MATCH ANALYSIS:
${JSON.stringify(matchAnalysis, null, 2)}`;

  try {
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0]?.message?.content || "{}";
    return JSON.parse(text) as GeneratedEmail;
  } catch (error) {
    console.error("OpenAI email generation failed:", error);
    return {
      subject: `Application for ${extractedPost.role} role`,
      content: `<h2>Hello,</h2><p>I am writing to express my interest in the ${extractedPost.role} position. With my background as a ${profileSummary.candidate_title}, I believe my skills are a strong fit for your requirements.</p><p>Looking forward to connecting.</p><p>Best regards,<br/>${profileSummary.candidate_name}</p>`
    };
  }
}
