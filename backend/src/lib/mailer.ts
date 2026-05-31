import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (
    env.SMTP_HOST === "smtp.ethereal.email" &&
    (!env.SMTP_USER || !env.SMTP_PASS)
  ) {
    console.log("No SMTP credentials provided. Creating a temporary Ethereal email account...");
    const testAccount = await nodemailer.createTestAccount();
    console.log(`Ethereal email account created!`);
    console.log(`Username: ${testAccount.user}`);
    console.log(`Password: ${testAccount.pass}`);
    
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: env.SMTP_USER && env.SMTP_PASS ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    } : undefined,
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ messageId: string; previewUrl?: string | false }> {
  if (!transporterPromise) {
    transporterPromise = getTransporter();
  }

  const transporter = await transporterPromise;
  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Email sent successfully! Preview URL: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
