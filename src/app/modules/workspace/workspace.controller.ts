import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { WorkspaceServices } from "./workspace.services";

const getChecklistProgress = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await WorkspaceServices.getChecklistProgress(decodedToken.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Workspace checklist progress retrieved successfully",
    data: result,
  });
});

const personalizeWorkspace = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await WorkspaceServices.personalizeWorkspace(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Workspace personalization updated successfully",
    data: result,
  });
});

const initiateDomainVerification = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { domain } = req.body;
  const result = await WorkspaceServices.initiateDomainVerification(
    decodedToken.userId,
    domain
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "DNS verification token generated successfully",
    data: result,
  });
});

const checkDomainVerification = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await WorkspaceServices.checkDomainVerification(decodedToken.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const updateSecuritySettings = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await WorkspaceServices.updateSecuritySettings(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Security settings updated successfully",
    data: result,
  });
});

export const WorkspaceController = {
  getChecklistProgress,
  personalizeWorkspace,
  initiateDomainVerification,
  checkDomainVerification,
  updateSecuritySettings,
};
