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

const toggleChecklistVisibility = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { hidden } = req.body;
  const result = await WorkspaceServices.toggleChecklistVisibility(
    decodedToken.userId,
    hidden
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const updateChecklistItemStatus = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { itemId } = req.params;
  const { completed } = req.body;
  const result = await WorkspaceServices.updateChecklistItemStatus(
    decodedToken.userId,
    itemId,
    completed
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Checklist item '${itemId}' status updated successfully`,
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
  const result = await WorkspaceServices.initiateDomainVerification(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
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

const confirmDomainByEmail = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { token } = req.body;
  const result = await WorkspaceServices.confirmDomainByEmail(
    decodedToken.userId,
    token
  );

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
    message: result.message,
    data: result,
  });
});

const updateProvisioningSettings = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await WorkspaceServices.updateProvisioningSettings(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const WorkspaceController = {
  getChecklistProgress,
  toggleChecklistVisibility,
  updateChecklistItemStatus,
  personalizeWorkspace,
  initiateDomainVerification,
  checkDomainVerification,
  confirmDomainByEmail,
  updateSecuritySettings,
  updateProvisioningSettings,
};
