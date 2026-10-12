import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { envVars } from "../../config/env";
import { checkAuth } from "../../middlewares/checkAuth";
import { rateLimiter } from "../../middlewares/rateLimiter";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { AuthControllers } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

const authRateLimiter = rateLimiter(15 * 60 * 1000, 10, "Too many authentication attempts. Please try again after 15 minutes.");

router.post("/register", authRateLimiter, validateRequest(AuthValidation.registerValidationSchema), AuthControllers.registerUser);
router.post("/login", authRateLimiter, validateRequest(AuthValidation.credentialsLoginValidationSchema), AuthControllers.credentialsLogin);
router.post("/refresh-token", authRateLimiter, AuthControllers.getNewAccessToken);
router.post("/logout", AuthControllers.logout);
router.post("/change-password", checkAuth(...Object.values(Role)), validateRequest(AuthValidation.changePasswordValidationSchema), AuthControllers.changePassword);
router.post("/set-password", checkAuth(...Object.values(Role)), validateRequest(AuthValidation.setPasswordValidationSchema), AuthControllers.setPassword);
router.post("/forgot-password", authRateLimiter, validateRequest(AuthValidation.forgotPasswordValidationSchema), AuthControllers.forgotPassword);
router.post("/verify-reset-otp", authRateLimiter, validateRequest(AuthValidation.verifyResetOtpValidationSchema), AuthControllers.verifyResetOtp);
router.post("/reset-password", authRateLimiter, validateRequest(AuthValidation.resetPasswordValidationSchema), AuthControllers.resetPassword);

router.get("/google", async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", { scope: ["profile", "email"], state: redirect as string })(req, res, next);
});

router.get("/google/callback", passport.authenticate("google", { failureRedirect: `${envVars.FRONTEND_URL}/login?error=There is some issues with your account. Please contact with out support team!` }), AuthControllers.googleCallbackController);

export const AuthRoutes = router;