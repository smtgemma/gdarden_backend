import crypto from "crypto";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { envVars } from "../../config/env";
import jwt from "jsonwebtoken";
import httpStatus from "http-status-codes";
import { sendEmail } from "../../utils/sendEmail";

import { createUserTokens } from "../../utils/userTokens";

// const OTP_EXPIRATION = 2 * 60 // 2minute

export const generateOtp = (length = 6) => {
    // 6 digit otp
    const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
    return otp;
};

const verifySignupOtp = async (email: string, otp: string | number) => {
  // Step 1: find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified. Please sign in.");
  }

  // Step 2: get OTP from Redis
  const redisKey = `otp:${email}`;
  const storedOtp = await redisClient.get(redisKey);

  if (!storedOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Verification code has expired or does not exist.");
  }

  if (String(storedOtp) !== String(otp)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid verification code.");
  }

  // Step 3: OTP is valid → delete from Redis
  await redisClient.del(redisKey);

  // Step 4: mark user as verified
  user.isVerified = true;
  await user.save();

  // Step 5: Send confirmation email
  sendEmail({
    to: user.email,
    subject: "Successful Registration - Welcome to Gdarden",
    templateName: "registrationSuccess",
    templateData: {
      name: user.name,
      email: user.email,
      phone: user.phone || "N/A",
      accountType: user.accountType,
      companyName: user.companyName || "N/A",
      senderName: "Gdarden Team",
    },
  }).catch((err) => console.error("Email verification notification failed:", err));

  const tokens = await createUserTokens(user);

  const { password: _, ...userWithoutPassword } = user.toObject();

  return {
    user: userWithoutPassword,
    tokens,
  };
};

const resendOtp = async (email: string) => {
  // Step 1: find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.isVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified. Please sign in.");
  }

  // Step 2: rate limit check on Redis
  const redisKey = `otp:${email}`;
  const existingOtp = await redisClient.get(redisKey);
  if (existingOtp) {
    throw new AppError(httpStatus.TOO_MANY_REQUESTS, "Verification code already sent. Please wait before requesting another.");
  }

  // Step 3: generate new OTP and store in Redis (2 minutes)
  const otp = generateOtp();
  await redisClient.set(redisKey, otp, { expiration: { type: "EX", value: 120 } });

  // Step 4: send OTP via email
  await sendEmail({
    to: email,
    subject: "Verify Your Email - Gdarden",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
      senderName: "Gdarden Team",
    },
  });

  return { message: "Verification code resent successfully" };
};

const verifyResetOtp = async (email: string, otp: string) => {
  const redisKey = `otp:reset:${email}`;
  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new AppError(401, "OTP expired or invalid");
  }

  if (String(savedOtp) !== String(otp)) {
    throw new AppError(401, "Invalid OTP");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (!user.isVerified) {
    throw new AppError(401, "User is not verified");
  }

  const verifiedKey = `otp:reset:verified:${email}`;

  const tokenId = crypto.randomUUID();
  const resetToken = jwt.sign(
    { email, userId: user._id, tokenId, purpose: "password_reset" },
    envVars.JWT_PASSWORD_RESET_SECRET,
    { expiresIn: "15m" }
  );

  await redisClient.set(`resetToken:${tokenId}`, email, {
    expiration: { type: "EX", value: 900 },
  });

  await redisClient.set(verifiedKey, resetToken, {
    expiration: { type: "EX", value: 900 },
  });

  await redisClient.del([redisKey]);

  return { resetToken };
};

const resendForgotPasswordOtp = async (email: string) => {
  // 1️⃣ Check user
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!user.isVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not verified");
  }

  if (user.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (user.isActive === "BLOCKED" || user.isActive === "INACTIVE") {
    throw new AppError(httpStatus.BAD_REQUEST, `User is ${user.isActive}`);
  }

  // 2️⃣ Same OTP KEY (VERY IMPORTANT)
  const redisKey = `otp:reset:${email}`;

  // 3️⃣ Prevent spam resend
  const existingOtp = await redisClient.get(redisKey);

  if (existingOtp) {
    throw new AppError(
      httpStatus.TOO_MANY_REQUESTS,
      "OTP already sent. Please wait 2 minutes."
    );
  }

  // 4️⃣ Generate OTP
  const otp = generateOtp();

  // 5️⃣ Save OTP (2 min expiry)
  await redisClient.set(redisKey, otp, {
    expiration: { type: "EX", value: 120 },
  });

  // 6️⃣ Send Email
  await sendEmail({
    to: email,
    subject: "Password Reset OTP",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
    },
  });

  return {
    message: "OTP resent successfully",
  };
};

export const OTPService = {
    generateOtp,
    verifySignupOtp,
    resendOtp,
    verifyResetOtp,
    resendForgotPasswordOtp
}
