import express from "express";
import { rateLimiter } from "../../middlewares/rateLimiter";
import { validateRequest } from "../../middlewares/validateRequest";
import { OTPController } from "./otp.controller";
import { OTPValidation } from "./otp.validation";

const router = express.Router();

const otpLimiter = rateLimiter(15 * 60 * 1000, 10, "Too many OTP requests. Please try again after 15 minutes.");

router.post(
  "/verify-email",
  otpLimiter,
  validateRequest(OTPValidation.verifySignupOtpZodSchema),
  OTPController.verifySignupOtp
);
router.post(
  "/verify-signup-otp",
  otpLimiter,
  validateRequest(OTPValidation.verifySignupOtpZodSchema),
  OTPController.verifySignupOtp
);

router.post(
  "/resend",
  otpLimiter,
  validateRequest(OTPValidation.resendOtpZodSchema),
  OTPController.resendOtp
);
router.post(
  "/resend-otp",
  otpLimiter,
  validateRequest(OTPValidation.resendOtpZodSchema),
  OTPController.resendOtp
);

router.post(
  "/forget-resend-otp",
  otpLimiter,
  validateRequest(OTPValidation.resendForgotPasswordOtpZodSchema),
  OTPController.resendForgotPasswordOtp
);

router.post(
  "/verify-reset-password",
  otpLimiter,
  validateRequest(OTPValidation.verifyResetOtpZodSchema),
  OTPController.verifyResetOtp
);

export const OtpRoutes = router;

