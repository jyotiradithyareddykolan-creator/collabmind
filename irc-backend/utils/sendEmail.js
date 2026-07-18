import nodemailer from "nodemailer";

// Lazily create the transporter so this always reads a real env value —
// same reasoning as the Cloudinary fix: avoid configuring at import time,
// before dotenv.config() has run.
function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// Generates a random 6-digit numeric code
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(toEmail, otp) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `CollabMind <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your CollabMind account",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Verify your email</h2>
        <p style="color: #444;">Enter this code to finish creating your CollabMind account:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a; margin: 24px 0;">
          ${otp}
        </p>
        <p style="color: #888; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}