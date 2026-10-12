import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { WorkspaceController } from "./workspace.controller";

import { validateRequest } from "../../middlewares/validateRequest";
import { WorkspaceValidation } from "./workspace.validation";

const router = Router();

// All workspace routes require authentication
router.use(checkAuth(...Object.values(Role)));

// Route 1: Setup Checklist Progress (Screen 38.8 & 38.9)
router.get("/checklist", WorkspaceController.getChecklistProgress);

// Route 2: Personalize Workspace (Screen 15)
router.post(
  "/personalize",
  validateRequest(WorkspaceValidation.personalizeValidationSchema),
  WorkspaceController.personalizeWorkspace
);

export const WorkspaceRoutes = router;
