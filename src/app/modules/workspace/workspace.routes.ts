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

// Route 2: Toggle Checklist Visibility ("Hide checklist" button on Screen 38.8 & 38.9)
router.patch(
  "/checklist/visibility",
  validateRequest(WorkspaceValidation.checklistVisibilityValidationSchema),
  WorkspaceController.toggleChecklistVisibility
);

// Route 3: Dynamic Checklist Item Status Update (e.g. mark asset/document/permissions complete)
router.patch(
  "/checklist/item/:itemId",
  validateRequest(WorkspaceValidation.checklistItemUpdateValidationSchema),
  WorkspaceController.updateChecklistItemStatus
);

// Route 4: Personalize Workspace (Screen 15)
router.post(
  "/personalize",
  validateRequest(WorkspaceValidation.personalizeValidationSchema),
  WorkspaceController.personalizeWorkspace
);

// Route 5: Initiate Domain Verification (Screen 30 - DNS TXT & Email Admin options)
router.post(
  "/verify-domain/initiate",
  validateRequest(WorkspaceValidation.domainInitiateValidationSchema),
  WorkspaceController.initiateDomainVerification
);

// Route 6: Check DNS Domain Verification (Screen 30)
router.post(
  "/verify-domain/check",
  WorkspaceController.checkDomainVerification
);

// Route 7: Confirm Domain via Admin Email Token (Screen 30)
router.post(
  "/verify-domain/confirm-email",
  validateRequest(WorkspaceValidation.domainEmailConfirmValidationSchema),
  WorkspaceController.confirmDomainByEmail
);

// Route 8: Configure Security Settings (Screen 32)
router.patch(
  "/security",
  validateRequest(WorkspaceValidation.securityValidationSchema),
  WorkspaceController.updateSecuritySettings
);

// Route 9: Configure Provisioning at Scale (Screen 33)
router.patch(
  "/provisioning",
  validateRequest(WorkspaceValidation.provisioningValidationSchema),
  WorkspaceController.updateProvisioningSettings
);

export const WorkspaceRoutes = router;
