import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status-codes";
import AppError from "../errorHelpers/AppError";
import { envVars } from "../config/env";

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Only enforce CSRF protection on state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const hasAuthCookies = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  const origin = req.headers["origin"] as string | undefined;
  const referer = req.headers["referer"] as string | undefined;

  let sourceHost = "";
  if (origin) {
    try {
      sourceHost = new URL(origin).origin;
    } catch {
      sourceHost = origin;
    }
  } else if (referer) {
    try {
      sourceHost = new URL(referer).origin;
    } catch {
      sourceHost = referer;
    }
  }

  // If request contains authentication cookies, fail closed if no Origin or Referer is provided
  if (hasAuthCookies && !sourceHost) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "CSRF validation failed: Missing Origin or Referer header for cookie-authenticated request"
    );
  }

  if (hasAuthCookies || sourceHost) {
    const isProduction = envVars.NODE_ENV === "production";

    const allowedOrigins = [
      "https://gdarden.com",
      "https://dashboard.gdarden.com",
      "https://www.gdarden.com",
      envVars.FRONTEND_URL,
      envVars.DASHBOARD_URL,
      envVars.FRONTEND_DOMAIN_URL,
      envVars.DASHBOARD_DOMAIN_URL,
      ...(!isProduction
        ? [
            envVars.FRONTEND_LOCALHOST_URL,
            envVars.DASHBOARD_LOCALHOST_URL,
            "http://localhost",
            "https://localhost",
            "http://localhost:3000",
            "http://localhost:3010",
            "http://localhost:5173",
            "http://localhost:3041",
          ]
        : []),
    ].filter(Boolean);

    const isLocalhost = sourceHost ? /^https?:\/\/localhost(:\d+)?$/.test(sourceHost) : false;

    if (!sourceHost || (!allowedOrigins.includes(sourceHost) && (isProduction || !isLocalhost))) {
      throw new AppError(httpStatus.FORBIDDEN, "CSRF validation failed: Invalid Origin or Referer");
    }
  }

  next();
};
