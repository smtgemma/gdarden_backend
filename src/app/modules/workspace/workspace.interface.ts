import { Types } from "mongoose";

export enum WorkspaceTier {
  INDIVIDUAL = "INDIVIDUAL",
  TEAM = "TEAM",
  BUSINESS = "BUSINESS",
  ENTERPRISE = "ENTERPRISE",
}

export enum AIControlLevel {
  SUGGEST_ONLY = "SUGGEST_ONLY",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  AUTONOMOUS = "AUTONOMOUS",
}

export enum WorkStylePreference {
  STRUCTURED = "STRUCTURED",
  FLEXIBLE = "FLEXIBLE",
  HYBRID = "HYBRID",
}

export interface IAICapabilityGovernance {
  incidentAnalysis?: AIControlLevel;
  autoCalibration?: AIControlLevel;
  inventoryRestock?: AIControlLevel;
  taskReassignment?: AIControlLevel;
}

export interface IWorkspaceSecuritySettings {
  requireMFA: boolean;
  strictPasswordPolicy: boolean;
  ssoEnabled: boolean;
  sessionTimeoutMinutes: number;
}

export interface IWorkspaceOrganization {
  name?: string;
  industry?: string;
  industryCustom?: string;
  size?: string;
  primaryDomain?: string;
  domainVerified?: boolean;
  domainVerificationToken?: string;
  verifiedAt?: Date;
}

export interface IWorkspacePersonalization {
  workStyle?: WorkStylePreference;
  notificationPrefs?: {
    assignedWork: boolean;
    teamUpdates: boolean;
    dueDates: boolean;
    incidents: boolean;
  };
  goals?: string[];
}

export interface IWorkspaceProvisioning {
  allowDomainAutoJoin: boolean;
  scimEnabled: boolean;
  provisioningMethod?: "EMAIL" | "DOMAIN" | "SCIM" | "CSV";
}

export interface IWorkspace {
  _id?: Types.ObjectId;
  name: string;
  tier: WorkspaceTier;
  ownerId: Types.ObjectId;
  teamName?: string;
  organization?: IWorkspaceOrganization;
  modules: string[];
  aiControl: {
    globalLevel: AIControlLevel;
    governance?: IAICapabilityGovernance;
  };
  securitySettings: IWorkspaceSecuritySettings;
  provisioning: IWorkspaceProvisioning;
  personalization?: IWorkspacePersonalization;
  isCompleted: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
