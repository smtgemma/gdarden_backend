import { z } from "zod";
import { AIControlLevel, WorkspaceTier } from "../workspace/workspace.interface";
import { InvitationAccessLevel } from "../invitation/invitation.interface";

const profileValidationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  jobTitle: z.string().min(2, "Job title is required"),
  primaryFunction: z.string().min(1, "Primary function is required"),
  primaryFunctionCustom: z.string().optional(),
  avatar: z.string().optional(),
});

const pathValidationSchema = z.object({
  path: z.nativeEnum(WorkspaceTier, {
    message: "Invalid workspace tier selected",
  }),
});

const teamWorkspaceValidationSchema = z.object({
  workspaceName: z.string().min(2, "Workspace name is required"),
  teamName: z.string().min(2, "Team name is required"),
});

const organizationValidationSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  industry: z.string().min(2, "Industry is required"),
  industryCustom: z.string().optional(),
  size: z.string().min(1, "Organization size is required"),
  primaryDomain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid domain format (e.g. acme.com)")
    .optional(),
});

const departmentStructureValidationSchema = z.object({
  departments: z
    .array(
      z.object({
        departmentName: z.string().min(2, "Department name is required"),
        description: z.string().optional(),
        teams: z.array(z.string().min(1, "Team name cannot be empty")),
      })
    )
    .min(1, "At least one department is required"),
});

const singleDepartmentValidationSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  description: z.string().optional(),
  teams: z.array(z.string().min(1, "Team name cannot be empty")).optional(),
});

const modulesValidationSchema = z.object({
  modules: z
    .array(z.string())
    .min(1, "Please select at least 1 module to get started"),
});

const invitationsValidationSchema = z.object({
  members: z
    .array(
      z.object({
        email: z.string().email("Invalid email address"),
        name: z.string().optional(),
        accessLevel: z.nativeEnum(InvitationAccessLevel).default(InvitationAccessLevel.MEMBER),
        jobRole: z.string().optional(),
        departmentId: z.string().optional(),
        teamId: z.string().optional(),
      })
    )
    .min(1, "At least one member is required to send invites"),
});

const aiGovernanceValidationSchema = z.object({
  globalLevel: z.nativeEnum(AIControlLevel),
  governance: z
    .object({
      incidentAnalysis: z.nativeEnum(AIControlLevel).optional(),
      autoCalibration: z.nativeEnum(AIControlLevel).optional(),
      inventoryRestock: z.nativeEnum(AIControlLevel).optional(),
      taskReassignment: z.nativeEnum(AIControlLevel).optional(),
    })
    .optional(),
});

export const SetupValidation = {
  profileValidationSchema,
  pathValidationSchema,
  teamWorkspaceValidationSchema,
  organizationValidationSchema,
  departmentStructureValidationSchema,
  singleDepartmentValidationSchema,
  modulesValidationSchema,
  invitationsValidationSchema,
  aiGovernanceValidationSchema,
};
