import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SetupServices } from "./setup.services";

const getSetupState = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SetupServices.getSetupState(decodedToken.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Onboarding state retrieved successfully",
    data: result,
  });
});

const setupProfile = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const uploadedFile = (req.files as Express.MulterS3.File[])?.[0];

  const result = await SetupServices.setupProfile(
    decodedToken.userId,
    req.body,
    uploadedFile
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile configured successfully. Proceed to path selection.",
    data: result,
  });
});

const selectPath = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { path } = req.body;

  const result = await SetupServices.selectPath(decodedToken.userId, path);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Workspace path set to ${path} successfully`,
    data: result,
  });
});

const setupTeamWorkspace = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SetupServices.setupTeamWorkspace(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Team workspace created successfully",
    data: result,
  });
});

const setupOrganization = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SetupServices.setupOrganization(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization details configured successfully",
    data: result,
  });
});

const setupDepartmentsAndTeams = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SetupServices.setupDepartmentsAndTeams(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Departments and teams configured successfully",
    data: result,
  });
});

const getDepartmentsAndTeams = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SetupServices.getDepartmentsAndTeams(decodedToken.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Departments and teams retrieved successfully",
    data: result,
  });
});

const deleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { id } = req.params;
  const result = await SetupServices.deleteDepartment(decodedToken.userId, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const setupModules = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { modules } = req.body;

  const result = await SetupServices.setupModules(decodedToken.userId, modules);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Workspace modules enabled successfully",
    data: result,
  });
});

const inviteMembers = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { members } = req.body;

  const result = await SetupServices.inviteMembers(decodedToken.userId, members);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Team invitations created successfully",
    data: result,
  });
});

const setupAIGovernance = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SetupServices.setupAIGovernance(
    decodedToken.userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AI control and governance configured successfully",
    data: result,
  });
});

const completeSetup = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await SetupServices.completeSetup(decodedToken.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.workspace,
  });
});

export const SetupController = {
  getSetupState,
  setupProfile,
  selectPath,
  setupTeamWorkspace,
  setupOrganization,
  setupDepartmentsAndTeams,
  getDepartmentsAndTeams,
  deleteDepartment,
  setupModules,
  inviteMembers,
  setupAIGovernance,
  completeSetup,
};
