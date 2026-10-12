import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OTPService } from "./otp.service";
import httpStatus from 'http-status-codes';

import { setAuthCookie } from "../../utils/setCookie";

const verifySignupOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    const result = await OTPService.verifySignupOtp(email, otp);

    if (result.tokens) {
      setAuthCookie(res, result.tokens);
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Email verified successfully. You can now proceed with your profile setup.",
      data: result,
    });
  }
);

const resendOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const result = await OTPService.resendOtp(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: null,
    });
  }
);

const verifyResetOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const result = await OTPService.verifyResetOtp(email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const resendForgotPasswordOtp = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await OTPService.resendForgotPasswordOtp(email);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: null,
    });
  }
);

export const OTPController = {
  verifySignupOtp,
  resendOtp,
  verifyResetOtp,
  resendForgotPasswordOtp
};
