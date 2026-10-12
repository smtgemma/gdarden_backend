import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { WorkspaceController } from "./workspace.controller";

const router = Router();

// All workspace routes require authentication
router.use(checkAuth(...Object.values(Role)));

// Route 1: Setup Checklist Progress (Screen 38.8 & 38.9)
router.get("/checklist", WorkspaceController.getChecklistProgress);

export const WorkspaceRoutes = router;
