import { Schema, model } from "mongoose";
import {
  AIControlLevel,
  IWorkspace,
  WorkspaceTier,
  WorkStylePreference,
} from "./workspace.interface";

const organizationSchema = new Schema(
  {
    name: { type: String, trim: true },
    industry: { type: String, trim: true },
    industryCustom: { type: String, trim: true },
    size: { type: String, trim: true },
    primaryDomain: { type: String, trim: true },
    domainVerified: { type: Boolean, default: false },
    domainVerificationToken: { type: String, default: null },
    adminEmail: { type: String, trim: true, default: null },
    adminEmailVerificationToken: { type: String, default: null },
    adminEmailVerificationExpires: { type: Date, default: null },
    verificationMethod: {
      type: String,
      enum: ["DNS_TXT", "EMAIL_ADMIN", "BOTH"],
      default: "DNS_TXT",
    },
    verifiedAt: { type: Date, default: null },
  },
  { _id: false, versionKey: false }
);

const aiCapabilityGovernanceSchema = new Schema(
  {
    incidentAnalysis: {
      type: String,
      enum: Object.values(AIControlLevel),
      default: AIControlLevel.SUGGEST_ONLY,
    },
    autoCalibration: {
      type: String,
      enum: Object.values(AIControlLevel),
      default: AIControlLevel.SUGGEST_ONLY,
    },
    inventoryRestock: {
      type: String,
      enum: Object.values(AIControlLevel),
      default: AIControlLevel.SUGGEST_ONLY,
    },
    taskReassignment: {
      type: String,
      enum: Object.values(AIControlLevel),
      default: AIControlLevel.SUGGEST_ONLY,
    },
  },
  { _id: false, versionKey: false }
);

const securitySettingsSchema = new Schema(
  {
    requireMFA: { type: Boolean, default: false },
    strictPasswordPolicy: { type: Boolean, default: true },
    ssoEnabled: { type: Boolean, default: false },
    sessionTimeoutMinutes: { type: Number, default: 30 },
    isConfigured: { type: Boolean, default: false },
  },
  { _id: false, versionKey: false }
);

const personalizationSchema = new Schema(
  {
    workStyle: {
      type: String,
      enum: Object.values(WorkStylePreference),
      default: WorkStylePreference.HYBRID,
    },
    notificationPrefs: {
      assignedWork: { type: Boolean, default: true },
      teamUpdates: { type: Boolean, default: true },
      dueDates: { type: Boolean, default: true },
      incidents: { type: Boolean, default: true },
    },
    goals: [{ type: String }],
    isConfigured: { type: Boolean, default: false },
  },
  { _id: false, versionKey: false }
);

const provisioningSchema = new Schema(
  {
    allowDomainAutoJoin: { type: Boolean, default: false },
    scimEnabled: { type: Boolean, default: false },
    bulkCsvEnabled: { type: Boolean, default: false },
    selectedMethods: [{ type: String, enum: ["SCIM", "DOMAIN", "CSV", "EMAIL"] }],
    provisioningMethod: {
      type: String,
      enum: ["EMAIL", "DOMAIN", "SCIM", "CSV"],
      default: "EMAIL",
    },
    isConfigured: { type: Boolean, default: false },
  },
  { _id: false, versionKey: false }
);

const checklistStatusSchema = new Schema(
  {
    hidden: { type: Boolean, default: false },
    addAssetsCompleted: { type: Boolean, default: false },
    uploadDocumentsCompleted: { type: Boolean, default: false },
    rolesReviewed: { type: Boolean, default: false },
    advancedPermissionsCompleted: { type: Boolean, default: false },
    notificationsConfigured: { type: Boolean, default: false },
    completedCustomItemIds: [{ type: String }],
  },
  { _id: false, versionKey: false }
);

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    tier: {
      type: String,
      enum: Object.values(WorkspaceTier),
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamName: { type: String, trim: true },
    organization: { type: organizationSchema, default: () => ({}) },
    modules: [{ type: String, trim: true }],
    aiControl: {
      globalLevel: {
        type: String,
        enum: Object.values(AIControlLevel),
        default: AIControlLevel.SUGGEST_ONLY,
      },
      governance: {
        type: aiCapabilityGovernanceSchema,
        default: () => ({}),
      },
    },
    securitySettings: {
      type: securitySettingsSchema,
      default: () => ({}),
    },
    provisioning: {
      type: provisioningSchema,
      default: () => ({}),
    },
    personalization: {
      type: personalizationSchema,
      default: () => ({}),
    },
    checklistStatus: {
      type: checklistStatusSchema,
      default: () => ({}),
    },
    isCompleted: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

workspaceSchema.index({ ownerId: 1, tier: 1 });
workspaceSchema.index({ "organization.primaryDomain": 1 });

export const Workspace = model<IWorkspace>("Workspace", workspaceSchema);
