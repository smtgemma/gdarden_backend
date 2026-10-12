import { z } from "zod";

const verifySignupOtpZodSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be exactly 6 digits"),
});

const resendOtpZodSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const verifyResetOtpZodSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be exactly 6 digits"),
});

const resendForgotPasswordOtpZodSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const OTPValidation = {
  verifySignupOtpZodSchema,
  resendOtpZodSchema,
  verifyResetOtpZodSchema,
  resendForgotPasswordOtpZodSchema,
};
