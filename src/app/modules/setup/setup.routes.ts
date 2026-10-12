import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { Role } from "../user/user.interface";
import { SetupController } from "./setup.controller";
import { SetupValidation } from "./setup.validation";
import { FileTypes, upload } from "../../config/S3Client.config";
import { parseFormDataMiddleware } from "../../middlewares/parseFormDataMiddleware";

const router = Router();

// All setup routes require authentication
router.use(checkAuth(...Object.values(Role)));

// Get current state
router.get("/state", SetupController.getSetupState);

// Step 1: Create Profile (supports photo upload or skip)
router.post(
  "/profile",
  upload({
    folder: "UserAvatar",
    fileType: FileTypes.IMAGE,
    maxCount: 1,
  }),
  parseFormDataMiddleware,
  validateRequest(SetupValidation.profileValidationSchema),
  SetupController.setupProfile
);

// Step 2: Choose Path (Individual, Team, Business, Enterprise)
router.post(
  "/path",
  validateRequest(SetupValidation.pathValidationSchema),
  SetupController.selectPath
);

// Step 3 (Team): Workspace & Team Name
router.post(
  "/team-workspace",
  validateRequest(SetupValidation.teamWorkspaceValidationSchema),
  SetupController.setupTeamWorkspace
);

// Step 3 (Business & Enterprise): Organization Info
router.post(
  "/organization",
  validateRequest(SetupValidation.organizationValidationSchema),
  SetupController.setupOrganization
);

// Step 4 (Business & Enterprise): Organization Structure (Departments & Teams)
router.post(
  "/departments-teams",
  validateRequest(SetupValidation.departmentStructureValidationSchema),
  SetupController.setupDepartmentsAndTeams
);
router.get("/departments-teams", SetupController.getDepartmentsAndTeams);
router.delete("/departments/:id", SetupController.deleteDepartment);

// Modules Selection (Step 3 Individual, Step 4 Team, Step 5 Business & Enterprise)
router.post(
  "/modules",
  validateRequest(SetupValidation.modulesValidationSchema),
  SetupController.setupModules
);

// People & Access / Invitations (Step 5 Team, Step 6 Business & Enterprise)
router.post(
  "/invitations",
  validateRequest(SetupValidation.invitationsValidationSchema),
  SetupController.inviteMembers
);

// AI Control & Governance (Step 4 Individual, Step 6 Team, Step 7 Business/Enterprise)
router.post(
  "/ai-governance",
  validateRequest(SetupValidation.aiGovernanceValidationSchema),
  SetupController.setupAIGovernance
);

// Finalize Setup: Workspace Ready (Step 5 Individual, Step 7 Team, Step 8 Business/Enterprise)
router.post("/complete", SetupController.completeSetup);

export const SetupRoutes = router;
