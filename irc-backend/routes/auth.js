import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PendingVerification from "../models/PendingVerification.js";
import { generateOTP, sendOTPEmail } from "../utils/sendEmail.js";

const router = express.Router();

const OTP_EXPIRY_MINUTES = 10;

// POST /api/auth/send-otp — step 1: user submits just their email
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await PendingVerification.findOneAndUpdate(
      { email },
      { email, otp, otpExpiresAt, verified: false },
      { upsert: true, new: true }
    );

    await sendOTPEmail(email, otp);

    res.json({ message: "Verification code sent to your email." });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/verify-otp — step 2: user submits the code
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const pending = await PendingVerification.findOne({ email });
    if (!pending) {
      return res.status(404).json({ message: "No verification in progress for this email" });
    }

    if (pending.otp !== otp) {
      return res.status(400).json({ message: "Incorrect code" });
    }

    if (pending.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "Code has expired. Request a new one." });
    }

    pending.verified = true;
    await pending.save();

    res.json({ message: "Email verified. You can now set your name and password." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/resend-otp — generates and sends a fresh code for an in-progress signup
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const pending = await PendingVerification.findOne({ email });
    if (!pending) {
      return res.status(404).json({ message: "No verification in progress for this email" });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    pending.otp = otp;
    pending.otpExpiresAt = otpExpiresAt;
    pending.verified = false;
    await pending.save();

    await sendOTPEmail(email, otp);

    res.json({ message: "A new code has been sent to your email." });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/complete-signup — step 3: user sets name + password, account is created
router.post("/complete-signup", async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const pending = await PendingVerification.findOne({ email });
    if (!pending || !pending.verified) {
      return res.status(403).json({ message: "Email has not been verified yet" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/;'~`]/.test(password);
    if (!hasSymbol) {
      return res.status(400).json({ message: "Password must contain at least one symbol" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    await PendingVerification.findOneAndDelete({ email });

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("Complete signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/auth/login — unchanged, still checks against real User accounts only
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;