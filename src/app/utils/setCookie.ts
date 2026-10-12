import { Response } from "express";
import { envVars } from "../config/env";

export interface AuthTokens {
    accessToken?: string;
    refreshToken?: string;
}

export const getAuthCookieOptions = () => {
    const isLocalhost = (envVars.NODE_ENV === "development" || process.env.NODE_ENV === "development") && !process.env.COOKIE_DOMAIN;
    const isSecure = !isLocalhost;
    const cookieDomain = isLocalhost ? undefined : (process.env.COOKIE_DOMAIN || ".gdarden.com");

    return {
        httpOnly: true,
        secure: isSecure,
        sameSite: isSecure ? ("none" as const) : ("lax" as const),
        path: "/",
        domain: cookieDomain
    };
};

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
    const cookieOptions = getAuthCookieOptions();

    if (tokenInfo.accessToken) {
        res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
    }

    if (tokenInfo.refreshToken) {
        res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions);
    }
};

export const clearAuthCookie = (res: Response) => {
    const cookieOptions = getAuthCookieOptions();

    // 1. Clear with exact configured cookie options (e.g. domain, path, sameSite, secure)
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    // 2. Clear host-only cookie (without domain property) in case cookie was stored host-only
    if (cookieOptions.domain) {
        const { domain, ...hostOnlyOptions } = cookieOptions;
        res.clearCookie("accessToken", hostOnlyOptions);
        res.clearCookie("refreshToken", hostOnlyOptions);

        // 3. Clear domain without leading dot if domain starts with '.'
        if (domain.startsWith(".")) {
            const cleanDomain = domain.substring(1);
            res.clearCookie("accessToken", { ...cookieOptions, domain: cleanDomain });
            res.clearCookie("refreshToken", { ...cookieOptions, domain: cleanDomain });
        }
    }

    // 4. Fallback clear with SameSite: "lax" / "strict" for legacy/localhost edge-cases
    const fallbackOptions = {
        httpOnly: true,
        path: "/",
        secure: cookieOptions.secure
    };
    res.clearCookie("accessToken", fallbackOptions);
    res.clearCookie("refreshToken", fallbackOptions);
};