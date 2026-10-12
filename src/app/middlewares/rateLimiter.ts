import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status-codes";
import { redisClient } from "../config/redis.config";
import { envVars } from "../config/env";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Redis & Memory-fallback Rate Limiter middleware for public endpoints
 * @param windowMs Time window in milliseconds (default 15 minutes)
 * @param maxMax Maximum requests per IP/Key within windowMs (default 300 attempts)
 * @param message Custom message on rate limit exceeded
 */
export const rateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  maxMax: number = 300,
  message: string = "Too many requests from this IP, please try again after 15 minutes."
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const xForwardedFor = req.headers["x-forwarded-for"];
    let clientIp = "unknown_ip";
    if (Array.isArray(xForwardedFor)) {
      clientIp = xForwardedFor[0]?.trim() || "unknown_ip";
    } else if (typeof xForwardedFor === "string") {
      clientIp = xForwardedFor.split(",")[0]?.trim() || "unknown_ip";
    } else if (req.ip) {
      clientIp = req.ip;
    } else if (req.socket?.remoteAddress) {
      clientIp = req.socket.remoteAddress;
    }

    const key = `ratelimit:${req.path}:${clientIp}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    if (redisClient.isOpen) {
      try {
        const count = await redisClient.incr(key);
        if (count === 1) {
          await redisClient.expire(key, windowSeconds);
        }
        if (Number(count) > maxMax) {
          return res.status(httpStatus.TOO_MANY_REQUESTS).json({
            success: false,
            message,
            statusCode: httpStatus.TOO_MANY_REQUESTS,
          });
        }
        return next();
      } catch (error) {
        console.error("Redis Rate Limiter Error:", error);
        if (envVars.NODE_ENV === "production") {
          return res.status(httpStatus.SERVICE_UNAVAILABLE).json({
            success: false,
            message: "Security service temporarily unavailable. Please try again shortly.",
            statusCode: httpStatus.SERVICE_UNAVAILABLE,
          });
        }
      }
    } else if (envVars.NODE_ENV === "production") {
      return res.status(httpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        message: "Security service temporarily unavailable. Please try again shortly.",
        statusCode: httpStatus.SERVICE_UNAVAILABLE,
      });
    }

    // Local/test fallback only. Production always requires centralized Redis
    // so limits cannot be bypassed across multiple processes or servers.
    const now = Date.now();
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[key].count += 1;

    if (store[key].count > maxMax) {
      return res.status(httpStatus.TOO_MANY_REQUESTS).json({
        success: false,
        message,
        statusCode: httpStatus.TOO_MANY_REQUESTS,
      });
    }

    next();
  };
};

// Periodic store cleanup every 10 minutes (unref'd so it won't keep Jest or Node process open)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const k in store) {
    if (store[k].resetTime < now) {
      delete store[k];
    }
  }
}, 10 * 60 * 1000);

if (cleanupTimer.unref) {
  cleanupTimer.unref();
}
