import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import passport from "passport";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { router } from "./app/routes";
import { rateLimiter } from "./app/middlewares/rateLimiter";

const app = express();

app.set("trust proxy", 1);

// 🛡️ SECURITY HARDENING
app.disable("x-powered-by");

// Custom Security Headers Middleware
app.use((req: Request, res: Response, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
  );
  next();
});

// Global Rate Limiter for API endpoints
const apiGlobalLimiter = rateLimiter(
  15 * 60 * 1000,
  300,
  "Too many requests from this IP, please try again after 15 minutes."
);
app.use("/api/v1", apiGlobalLimiter);

import { RedisSessionStore } from "./app/config/redisSessionStore";
import { csrfProtection } from "./app/middlewares/csrfProtection";

app.use(expressSession({
  store: new RedisSessionStore(),
  secret: envVars.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        envVars.FRONTEND_URL,
        envVars.FRONTEND_LOCALHOST_URL,
        envVars.DASHBOARD_URL,
        envVars.DASHBOARD_LOCALHOST_URL,
        envVars.FRONTEND_DOMAIN_URL,
        envVars.DASHBOARD_DOMAIN_URL
      ];

      const isLocalhost = origin ? /^https?:\/\/localhost(:\d+)?$/.test(origin) : false;

      if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/api/v1", csrfProtection, router);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Gdarden API Service is operational",
    status: "healthy",
  });
});

app.use(notFound);

app.use(globalErrorHandler);

export default app;