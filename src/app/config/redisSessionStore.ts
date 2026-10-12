import session from "express-session";
import { redisClient } from "./redis.config";

export class RedisSessionStore extends session.Store {
  private prefix: string;

  constructor(prefix = "sess:") {
    super();
    this.prefix = prefix;
  }

  get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void): void {
    if (!redisClient.isOpen) {
      return callback(new Error("Redis session store is unavailable"));
    }
    redisClient
      .get(this.prefix + sid)
      .then((data) => {
        if (!data) return callback(null, null);
        try {
          const result = JSON.parse(String(data));
          callback(null, result);
        } catch (err) {
          callback(err);
        }
      })
      .catch((err) => callback(err));
  }

  set(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void): void {
    if (!redisClient.isOpen) {
      if (callback) callback(new Error("Redis session store is unavailable"));
      return;
    }
    const ttl = sessionData.cookie?.maxAge
      ? Math.ceil(sessionData.cookie.maxAge / 1000)
      : 86400;
    const value = JSON.stringify(sessionData);
    redisClient
      .set(this.prefix + sid, value, { EX: ttl })
      .then(() => {
        if (callback) callback();
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    if (!redisClient.isOpen) {
      if (callback) callback(new Error("Redis session store is unavailable"));
      return;
    }
    redisClient
      .del(this.prefix + sid)
      .then(() => {
        if (callback) callback();
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  }

  touch(sid: string, sessionData: session.SessionData, callback?: (err?: any) => void): void {
    if (!redisClient.isOpen) {
      if (callback) callback(new Error("Redis session store is unavailable"));
      return;
    }
    const ttl = sessionData.cookie?.maxAge
      ? Math.ceil(sessionData.cookie.maxAge / 1000)
      : 86400;
    redisClient
      .expire(this.prefix + sid, ttl)
      .then(() => {
        if (callback) callback();
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  }
}
