// src/modules/otp/otp.routes.ts
import express from "express";
import { rateLimiter } from "../../middlewares/rateLimiter";
import { OTPController } from "./otp.controller";

const router = express.Router();

const otpLimiter = rateLimiter(15 * 60 * 1000, 5, "Too many OTP requests. Please try again after 15 minutes.");

router.post("/verify-signup-otp", otpLimiter, OTPController.verifySignupOtp);
router.post("/resend-otp", otpLimiter, OTPController.resendOtp);

router.post("/forget-resend-otp", otpLimiter, OTPController.resendForgotPasswordOtp);

router.post("/verify-reset-password", otpLimiter, OTPController.verifyResetOtp);
export const OtpRoutes = router;

