import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { AccountStatus, IsActive, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { generateToken, verifyToken } from "./jwt";

export const createUserTokens = (user: Partial<IUser>) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
        department: user.department,
        organizationId: user.organizationId,
        accountType: user.accountType,
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    const refreshToken = generateToken(jwtPayload, envVars.JWT_REFRESH_SECRET, envVars.JWT_REFRESH_EXPIRES)


    return {
        accessToken,
        refreshToken
    }
}

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => {
    let verifiedRefreshToken: JwtPayload;

    try {
        verifiedRefreshToken = verifyToken(refreshToken, envVars.JWT_REFRESH_SECRET) as JwtPayload;
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token expired");
        }
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    const isUserExist = await User.findOne({ email: verifiedRefreshToken.email });

    if (!isUserExist) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
    }
    if (isUserExist.isActive === IsActive.BLOCKED || isUserExist.isActive === IsActive.INACTIVE) {
        throw new AppError(httpStatus.UNAUTHORIZED, `User is ${isUserExist.isActive}`);
    }
    if (isUserExist.status === AccountStatus.PENDING || isUserExist.status === AccountStatus.REJECTED) {
        throw new AppError(httpStatus.UNAUTHORIZED, `Account status is ${isUserExist.status}`);
    }
    if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User is deleted");
    }

    const jwtPayload = {
        userId: isUserExist._id,
        email: isUserExist.email,
        role: isUserExist.role,
        department: isUserExist.department,
        organizationId: isUserExist.organizationId,
        accountType: isUserExist.accountType,
    }
    const accessToken = generateToken(jwtPayload, envVars.JWT_ACCESS_SECRET, envVars.JWT_ACCESS_EXPIRES)

    return accessToken
}