import { Types } from "mongoose";
import { AIControlLevel, WorkspaceTier } from "../workspace/workspace.interface";
import { InvitationAccessLevel } from "../invitation/invitation.interface";

export interface IProfileSetupPayload {
  name: string;
  jobTitle: string;
  primaryFunction: string;
  primaryFunctionCustom?: string;
  avatar?: string;
}

export interface IPathSelectionPayload {
  path: WorkspaceTier;
}

export interface ITeamWorkspacePayload {
  workspaceName: string;
  teamName: string;
}

export interface IOrganizationPayload {
  organizationName: string;
  industry: string;
  industryCustom?: string;
  size: string;
  primaryDomain?: string;
}

export interface IDepartmentTeamItem {
  departmentName: string;
  description?: string;
  teams: string[];
}

export interface IDepartmentStructurePayload {
  departments: IDepartmentTeamItem[];
}

export interface IModulesSelectionPayload {
  modules: string[];
}

export interface IInviteMemberItem {
  email: string;
  name?: string;
  accessLevel: InvitationAccessLevel;
  jobRole?: string;
  departmentId?: string;
  teamId?: string;
}

export interface IInvitationsPayload {
  members: IInviteMemberItem[];
}

export interface IAIGovernancePayload {
  globalLevel: AIControlLevel;
  governance?: {
    incidentAnalysis?: AIControlLevel;
    autoCalibration?: AIControlLevel;
    inventoryRestock?: AIControlLevel;
    taskReassignment?: AIControlLevel;
  };
}
