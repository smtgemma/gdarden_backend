import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const registerValidationSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters long")
      .max(60, "Full name cannot exceed 60 characters"),
    email: z
      .string()
      .email("Please provide a valid work email address"),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "You must agree to the Terms of Service and Privacy Policy",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const credentialsLoginValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordValidationSchema = z
  .object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const resetPasswordValidationSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
    resetToken: z.string().min(1, "Reset token is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const setPasswordValidationSchema = z.object({
  password: strongPasswordSchema,
});

const forgotPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const verifyResetOtpValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
});

export const AuthValidation = {
  strongPasswordSchema,
  registerValidationSchema,
  credentialsLoginValidationSchema,
  changePasswordValidationSchema,
  resetPasswordValidationSchema,
  setPasswordValidationSchema,
  forgotPasswordValidationSchema,
  verifyResetOtpValidationSchema,
};
