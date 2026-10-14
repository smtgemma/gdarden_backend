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
  isConfigured?: boolean;
}

export interface IWorkspaceOrganization {
  name?: string;
  industry?: string;
  industryCustom?: string;
  size?: string;
  primaryDomain?: string;
  domainVerified?: boolean;
  domainVerificationToken?: string;
  adminEmail?: string;
  adminEmailVerificationToken?: string;
  adminEmailVerificationExpires?: Date;
  verificationMethod?: "DNS_TXT" | "EMAIL_ADMIN" | "BOTH";
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
  isConfigured?: boolean;
}

export interface IWorkspaceProvisioning {
  allowDomainAutoJoin: boolean;
  scimEnabled: boolean;
  bulkCsvEnabled?: boolean;
  selectedMethods?: ("SCIM" | "DOMAIN" | "CSV" | "EMAIL")[];
  isConfigured?: boolean;
  provisioningMethod?: "EMAIL" | "DOMAIN" | "SCIM" | "CSV";
}

export interface IWorkspaceChecklistStatus {
  hidden?: boolean;
  addAssetsCompleted?: boolean;
  uploadDocumentsCompleted?: boolean;
  rolesReviewed?: boolean;
  advancedPermissionsCompleted?: boolean;
  notificationsConfigured?: boolean;
  completedCustomItemIds?: string[];
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
  checklistStatus?: IWorkspaceChecklistStatus;
  isCompleted: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
