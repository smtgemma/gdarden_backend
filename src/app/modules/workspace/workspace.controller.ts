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

export const WorkspaceController = {
  getChecklistProgress,
};
