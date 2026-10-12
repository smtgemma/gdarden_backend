
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { AccountStatus, AccountType, IAuthProvider, Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { redisClient } from "../../config/redis.config";
import { generateOtp } from "../otp/otp.service";

interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  agreeTerms?: boolean;
}

const registerUser = async (payload: IRegisterPayload) => {
  const { name, email, password } = payload;

  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(httpStatus.CONFLICT, "An account with this email already exists");
  }

  const hashedPassword = await bcryptjs.hash(
    password,
    Number(envVars.BCRYPT_SALT_ROUND || 10)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email,
  };

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: Role.USER,
    accountType: AccountType.INDIVIDUAL,
    status: AccountStatus.APPROVED,
    isVerified: false,
    auths: [authProvider],
  });

  const otp = generateOtp();
  const redisKey = `otp:${email}`;

  await redisClient.set(redisKey, otp, {
    expiration: { type: "EX", value: 120 },
  });

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

  const { password: _, ...userWithoutPassword } = user.toObject();

  return {
    user: userWithoutPassword,
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(refreshToken);

  return {
    accessToken: newAccessToken,
  };
};

const resetPassword = async (
  email: string,
  newPassword: string,
  confirmPassword: string,
  token?: string
) => {
  if (newPassword !== confirmPassword) {
    throw new AppError(400, "Passwords do not match");
  }

  if (!token) {
    throw new AppError(401, "Valid single-use reset token is required");
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, envVars.JWT_PASSWORD_RESET_SECRET);
  } catch (err) {
    throw new AppError(401, "Invalid or expired reset token");
  }

  if (decoded.purpose !== "password_reset" || !decoded.tokenId) {
    throw new AppError(401, "Invalid token purpose");
  }

  if (decoded.email && email && decoded.email.toLowerCase() !== email.toLowerCase()) {
    throw new AppError(401, "Reset token email mismatch");
  }

  const redisKey = `resetToken:${decoded.tokenId}`;
  let isTokenInRedis: string | Buffer | null = null;

  if (typeof (redisClient as any).getDel === "function") {
    isTokenInRedis = await (redisClient as any).getDel(redisKey);
  } else {
    isTokenInRedis = await redisClient.get(redisKey);
    if (isTokenInRedis) {
      await redisClient.del([redisKey]);
    }
  }

  if (!isTokenInRedis) {
    throw new AppError(401, "Reset token has already been used or expired");
  }

  const verifiedEmail = decoded.email || email;

  const user = await User.findOne({ email: verifiedEmail });

  if (!user) throw new AppError(404, "User not found");
  if (!user.isVerified) throw new AppError(401, "User not verified");
  if (user.isDeleted) throw new AppError(400, "User is deleted");
  if (user.isActive === "BLOCKED" || user.isActive === "INACTIVE") {
    throw new AppError(400, `User is ${user.isActive}`);
  }

  const hashedPassword = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUND || 10)
  );

  user.password = hashedPassword;
  await user.save();

  return null;
};

const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) throw new AppError(404, "User not found");
  if (!user.isVerified) throw new AppError(401, "User not verified");
  if (user.isDeleted) throw new AppError(400, "User is deleted");
  if (user.isActive === "BLOCKED" || user.isActive === "INACTIVE") {
    throw new AppError(400, `User is ${user.isActive}`);
  }

  const redisKey = `otp:reset:${email}`;

  const existingOtp = await redisClient.get(redisKey);
  if (existingOtp) {
    throw new AppError(429, "OTP already sent. Please wait 2 minutes.");
  }

  const otp = generateOtp();

  await redisClient.set(redisKey, otp, {
    expiration: { type: "EX", value: 120 },
  });

  await sendEmail({
    to: email,
    subject: "Password Reset OTP",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
    },
  });
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.password && user.auths.some(providerObject => providerObject.provider === "google")) {
    throw new AppError(httpStatus.BAD_REQUEST, "You have already set you password. Now you can change the password from your profile password update")
  }

  const hashedPassword = await bcryptjs.hash(
    plainPassword,
    Number(envVars.BCRYPT_SALT_ROUND)
  )

  const credentialProvider: IAuthProvider = {
    provider: "credentials",
    providerId: user.email
  }

  const auths: IAuthProvider[] = [...user.auths, credentialProvider]

  user.password = hashedPassword

  user.auths = auths

  await user.save()

}
const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string, decodedToken: JwtPayload) => {
  const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(newPassword);
  if (!isStrongPassword) {
    throw new AppError(400, "Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
  }
  if (newPassword !== confirmPassword) {
    throw new AppError(400, "Passwords do not match");
  }
  const user = await User.findById(decodedToken.userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const isOldPasswordMatch = await bcryptjs.compare(oldPassword, user.password as string);
  if (!isOldPasswordMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old Password does not match");
  }

  user.password = await bcryptjs.hash(newPassword, Number(envVars.BCRYPT_SALT_ROUND));

  await user.save();
};

const verifyResetOtp = async (email: string, otp: string) => {
  const redisKey = `otp:reset:${email}`;
  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Verification code has expired or does not exist");
  }

  if (String(savedOtp) !== String(otp)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid verification code");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const tokenId = crypto.randomUUID();
  const resetToken = jwt.sign(
    { email, userId: user._id, tokenId, purpose: "password_reset" },
    envVars.JWT_PASSWORD_RESET_SECRET,
    { expiresIn: "15m" }
  );

  await redisClient.set(`resetToken:${tokenId}`, email, {
    expiration: { type: "EX", value: 900 },
  });

  await redisClient.del(redisKey);

  return { resetToken };
};

export const AuthServices = {
  registerUser,
  getNewAccessToken,
  changePassword,
  setPassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
};