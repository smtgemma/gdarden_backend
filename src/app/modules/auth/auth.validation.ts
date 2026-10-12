import { z } from "zod";

export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const credentialsLoginValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordValidationSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const resetPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
  resetToken: z.string().min(1, "Reset token is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const setPasswordValidationSchema = z.object({
  password: strongPasswordSchema,
});

const forgotPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const AuthValidation = {
  strongPasswordSchema,
  credentialsLoginValidationSchema,
  changePasswordValidationSchema,
  resetPasswordValidationSchema,
  setPasswordValidationSchema,
  forgotPasswordValidationSchema,
};
