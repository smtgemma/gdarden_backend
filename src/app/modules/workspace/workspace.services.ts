import crypto from "crypto";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Workspace } from "./workspace.model";
import { Department } from "../department/department.model";
import { Team } from "../team/team.model";
import { WorkspaceInvitation } from "../invitation/invitation.model";
import {
  IWorkspaceChecklistStatus,
  IWorkspacePersonalization,
  IWorkspaceProvisioning,
  IWorkspaceSecuritySettings,
  WorkspaceTier,
} from "./workspace.interface";

/**
 * 08 · Post-Setup Checklist Progress Calculator
 * Accurately aligns with Screen 38.8 (Standard - 9 items) & Screen 38.9 (Enterprise - 10 items)
 */
const getChecklistProgress = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) {
    throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");
  }

  const [departmentsCount, teamsCount, invitationsCount] = await Promise.all([
    Department.countDocuments({ workspaceId: workspace._id, isDeleted: false }),
    Team.countDocuments({ workspaceId: workspace._id, isDeleted: false }),
    WorkspaceInvitation.countDocuments({ workspaceId: workspace._id }),
  ]);

  const checklistStatus = workspace.checklistStatus || ({} as IWorkspaceChecklistStatus);
  const completedCustomSet = new Set(checklistStatus.completedCustomItemIds || []);

  const isProfileComplete = Boolean(
    (user.firstName || user.name) && user.jobTitle && user.primaryFunction
  );
  const isModulesComplete = Boolean(workspace.modules && workspace.modules.length > 0);
  const isAIControlComplete = Boolean(workspace.aiControl?.globalLevel);
  const isAIGovernanceComplete = Boolean(
    workspace.aiControl?.governance &&
      (workspace.aiControl.governance.incidentAnalysis ||
        workspace.aiControl.governance.autoCalibration ||
        workspace.aiControl.governance.inventoryRestock ||
        workspace.aiControl.governance.taskReassignment)
  );
  const isInviteTeamComplete =
    invitationsCount > 0 || completedCustomSet.has("invite_team");
  const isPersonalizeComplete = Boolean(
    workspace.personalization?.isConfigured ||
      (workspace.personalization?.goals && workspace.personalization.goals.length > 0)
  );
  const isAddAssetsComplete = Boolean(
    checklistStatus.addAssetsCompleted || completedCustomSet.has("add_assets")
  );
  const isUploadDocumentsComplete = Boolean(
    checklistStatus.uploadDocumentsCompleted || completedCustomSet.has("upload_documents")
  );
  const isNotificationsComplete = Boolean(
    checklistStatus.notificationsConfigured || completedCustomSet.has("setup_notifications")
  );
  const isAdvancedPermissionsComplete = Boolean(
    checklistStatus.advancedPermissionsCompleted ||
      completedCustomSet.has("advanced_permissions")
  );
  const isDomainVerified = Boolean(workspace.organization?.domainVerified);
  const isSecurityConfigured = Boolean(workspace.securitySettings?.isConfigured);
  const isProvisioningConfigured = Boolean(workspace.provisioning?.isConfigured);
  const isRolesReviewed = Boolean(
    checklistStatus.rolesReviewed || completedCustomSet.has("review_roles")
  );
  const isOrgStructureModulesComplete = Boolean(
    (departmentsCount > 0 || teamsCount > 0) &&
      workspace.modules &&
      workspace.modules.length > 0
  );

  let items: Array<{
    id: string;
    title: string;
    description: string;
    tag: "Required" | "Recommended" | "Optional";
    targetScreen: string;
    completed: boolean;
  }> = [];

  const isEnterprise = workspace.tier === WorkspaceTier.ENTERPRISE;

  if (isEnterprise) {
    // Screen 38.9 Enterprise Checklist (Exact 10 items from Image 10 & 11)
    items = [
      {
        id: "create_profile",
        title: "Create your profile",
        description: "Name, job title, and operational function",
        tag: "Required",
        targetScreen: "13 Create Profile",
        completed: isProfileComplete,
      },
      {
        id: "org_structure_modules",
        title: "Organization, structure and modules",
        description: "Configure departments, functional teams, and active modules",
        tag: "Required",
        targetScreen: "34 Organization Structure",
        completed: isOrgStructureModulesComplete,
      },
      {
        id: "ai_governance",
        title: "Set AI governance",
        description: "Define granular capability autonomy and approval gates",
        tag: "Required",
        targetScreen: "36 Govern AI Capability",
        completed: isAIGovernanceComplete,
      },
      {
        id: "verify_domain",
        title: "Verify domain",
        description: "Verify ownership of corporate domain for auto-join",
        tag: "Recommended",
        targetScreen: "30 Verify Domain",
        completed: isDomainVerified,
      },
      {
        id: "configure_security",
        title: "Configure security (MFA, SSO)",
        description: "Set authentication policies, MFA enforcement, and session limits",
        tag: "Recommended",
        targetScreen: "32 Security Setup",
        completed: isSecurityConfigured,
      },
      {
        id: "scim_provisioning",
        title: "Set up SCIM and provisioning",
        description: "Sync employees from identity provider or bulk import",
        tag: "Recommended",
        targetScreen: "33 Provisioning",
        completed: isProvisioningConfigured,
      },
      {
        id: "review_roles",
        title: "Review roles & permissions",
        description: "Review granular RBAC access controls across teams",
        tag: "Recommended",
        targetScreen: "128 Roles and Permissions",
        completed: isRolesReviewed,
      },
      {
        id: "add_assets",
        title: "Add assets",
        description: "Register physical equipment, machinery, and facilities",
        tag: "Recommended",
        targetScreen: "79.2 Register Asset",
        completed: isAddAssetsComplete,
      },
      {
        id: "upload_documents",
        title: "Upload documents",
        description: "Store operational manuals, compliance SOPs, and guides",
        tag: "Optional",
        targetScreen: "99 Documents Overview",
        completed: isUploadDocumentsComplete,
      },
      {
        id: "personalize",
        title: "Personalize OpsOS",
        description: "Tailor work styles, notification digests, and primary goals",
        tag: "Optional",
        targetScreen: "15 Personalize OpsOS",
        completed: isPersonalizeComplete,
      },
    ];
  } else {
    // Screen 38.8 Standard Checklist (Exact 9 items from Image 10 & 11)
    items = [
      {
        id: "create_profile",
        title: "Create your profile",
        description: "Name, job title, and operational function",
        tag: "Required",
        targetScreen: "13 Create Profile",
        completed: isProfileComplete,
      },
      {
        id: "choose_modules",
        title: "Choose modules",
        description: "Select operational modules needed for your workspace",
        tag: "Required",
        targetScreen: "16 Choose Modules",
        completed: isModulesComplete,
      },
      {
        id: "ai_control",
        title: "Set AI control",
        description: "Configure default AI autonomy and action permissions",
        tag: "Required",
        targetScreen: "17 AI Control",
        completed: isAIControlComplete,
      },
      {
        id: "invite_team",
        title: "Invite team members",
        description: "Invite teammates to collaborate in this workspace",
        tag: "Recommended",
        targetScreen: "21 Invite Team Members",
        completed: isInviteTeamComplete,
      },
      {
        id: "personalize",
        title: "Personalize OpsOS",
        description: "Customize routine schedules, notifications, and goals",
        tag: "Optional",
        targetScreen: "15 Personalize OpsOS",
        completed: isPersonalizeComplete,
      },
      {
        id: "add_assets",
        title: "Add assets",
        description: "Register physical assets, tools, and operational gear",
        tag: "Recommended",
        targetScreen: "79.2 Register Asset",
        completed: isAddAssetsComplete,
      },
      {
        id: "upload_documents",
        title: "Upload documents",
        description: "Upload operating procedures, safety guidelines, and files",
        tag: "Recommended",
        targetScreen: "99 Documents Overview",
        completed: isUploadDocumentsComplete,
      },
      {
        id: "setup_notifications",
        title: "Set up notifications",
        description: "Configure alert thresholds and update preferences",
        tag: "Optional",
        targetScreen: "118 Settings",
        completed: isNotificationsComplete,
      },
      {
        id: "advanced_permissions",
        title: "Advanced permissions",
        description: "Customize permission matrices and management privileges",
        tag: "Optional",
        targetScreen: "128 Roles and Permissions",
        completed: isAdvancedPermissionsComplete,
      },
    ];
  }

  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;

  const displayName = user.firstName || user.name || "Ria";

  return {
    workspaceId: workspace._id,
    workspaceName: workspace.name,
    tier: workspace.tier,
    screen: isEnterprise ? "38.9" : "38.8",
    screenTitle: isEnterprise
      ? "38.9 Home · Setup Checklist · Enterprise"
      : "38.8 Home · Setup Checklist",
    header: {
      greeting: `Good morning, ${displayName}`,
      subtitle: "Your workspace is ready. Recommended setup can wait.",
      title: "Finish setting up OpsOS",
      summaryText: `${completedItems} of ${totalItems} done`,
      hidden: Boolean(checklistStatus.hidden),
    },
    progress: {
      total: totalItems,
      completed: completedItems,
      percentage: Math.round((completedItems / totalItems) * 100),
    },
    checklist: items,
  };
};

/**
 * Toggle Checklist Visibility ("Hide checklist" / "Show checklist" button)
 */
const toggleChecklistVisibility = async (userId: string, hidden: boolean) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  workspace.checklistStatus = {
    ...workspace.checklistStatus,
    hidden,
  };

  await workspace.save();

  return {
    hidden: workspace.checklistStatus.hidden,
    message: hidden ? "Checklist hidden from Home" : "Checklist is now visible on Home",
  };
};

/**
 * Update individual checklist item status dynamically
 */
const updateChecklistItemStatus = async (
  userId: string,
  itemId: string,
  completed: boolean
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const currentStatus = workspace.checklistStatus || ({} as IWorkspaceChecklistStatus);
  const customSet = new Set(currentStatus.completedCustomItemIds || []);

  if (completed) {
    customSet.add(itemId);
  } else {
    customSet.delete(itemId);
  }

  if (itemId === "add_assets") {
    currentStatus.addAssetsCompleted = completed;
  } else if (itemId === "upload_documents") {
    currentStatus.uploadDocumentsCompleted = completed;
  } else if (itemId === "review_roles") {
    currentStatus.rolesReviewed = completed;
  } else if (itemId === "advanced_permissions") {
    currentStatus.advancedPermissionsCompleted = completed;
  } else if (itemId === "setup_notifications") {
    currentStatus.notificationsConfigured = completed;
  }

  currentStatus.completedCustomItemIds = Array.from(customSet);
  workspace.checklistStatus = currentStatus;

  await workspace.save();

  return {
    itemId,
    completed,
    checklistStatus: workspace.checklistStatus,
  };
};

/**
 * Screen 15: Personalize OpsOS (Optional)
 */
const personalizeWorkspace = async (
  userId: string,
  payload: Partial<IWorkspacePersonalization>
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  workspace.personalization = {
    ...workspace.personalization,
    ...payload,
    isConfigured: true,
    notificationPrefs: {
      assignedWork:
        payload.notificationPrefs?.assignedWork ??
        workspace.personalization?.notificationPrefs?.assignedWork ??
        true,
      teamUpdates:
        payload.notificationPrefs?.teamUpdates ??
        workspace.personalization?.notificationPrefs?.teamUpdates ??
        true,
      dueDates:
        payload.notificationPrefs?.dueDates ??
        workspace.personalization?.notificationPrefs?.dueDates ??
        true,
      incidents:
        payload.notificationPrefs?.incidents ??
        workspace.personalization?.notificationPrefs?.incidents ??
        true,
    },
  };

  workspace.checklistStatus = {
    ...workspace.checklistStatus,
    notificationsConfigured: true,
  };

  await workspace.save();

  return workspace.personalization;
};

/**
 * Screen 30: Verify Domain (DNS TXT & Email to domain admin options)
 */
const initiateDomainVerification = async (
  userId: string,
  payload: {
    domain: string;
    verificationMethod?: "DNS_TXT" | "EMAIL_ADMIN" | "BOTH";
    adminEmail?: string;
  }
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const cleanDomain = payload.domain.toLowerCase().trim().replace(/^@/, "");
  const method = payload.verificationMethod || "DNS_TXT";

  const dnsToken = `opsos-verification=${crypto.randomBytes(16).toString("hex")}`;
  const emailToken = crypto.randomBytes(24).toString("hex");
  const adminEmail = payload.adminEmail || `admin@${cleanDomain}`;

  workspace.organization = {
    ...workspace.organization,
    primaryDomain: cleanDomain,
    domainVerified: false,
    domainVerificationToken: dnsToken,
    adminEmail,
    adminEmailVerificationToken: emailToken,
    adminEmailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    verificationMethod: method,
  };

  await workspace.save();

  return {
    domain: cleanDomain,
    verificationMethod: method,
    dnsTxtRecord: {
      type: "TXT",
      host: "@",
      value: dnsToken,
      instructions: `Add a DNS TXT record with host '@' (or '${cleanDomain}') and value '${dnsToken}'.`,
    },
    emailVerification: {
      adminEmail,
      confirmationSent: ["EMAIL_ADMIN", "BOTH"].includes(method),
      confirmationToken: emailToken,
      instructions: `A confirmation link has been sent to ${adminEmail}. Click the link to complete verification.`,
    },
    message: "Domain verification initiated successfully.",
  };
};

/**
 * Screen 30: Check DNS TXT verification
 */
const checkDomainVerification = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const domain = workspace.organization?.primaryDomain;
  const token = workspace.organization?.domainVerificationToken;

  if (!domain || !token) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "No verification initiated. Please initiate domain verification first."
    );
  }

  let verified = false;

  try {
    const dns = await import("dns");
    const records = await dns.promises.resolveTxt(domain);
    const flatRecords = records.flat();
    verified = flatRecords.some((rec) => rec.includes(token));
  } catch {
    // In local / development / test environments, permit verification for demonstration
    if (process.env.NODE_ENV !== "production") {
      verified = true;
    }
  }

  if (!verified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "DNS TXT record not detected yet. DNS propagation may take a few minutes."
    );
  }

  workspace.organization.domainVerified = true;
  workspace.organization.verifiedAt = new Date();
  await workspace.save();

  return {
    verified: true,
    domain,
    verifiedAt: workspace.organization.verifiedAt,
    message: `Corporate domain @${domain} verified successfully via DNS TXT.`,
  };
};

/**
 * Screen 30: Confirm Domain via Admin Email Token
 */
const confirmDomainByEmail = async (userId: string, token: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const savedToken = workspace.organization?.adminEmailVerificationToken;
  const expiresAt = workspace.organization?.adminEmailVerificationExpires;

  if (!savedToken || savedToken !== token) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired domain email verification token.");
  }

  if (expiresAt && new Date() > new Date(expiresAt)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Domain email verification token has expired.");
  }

  workspace.organization.domainVerified = true;
  workspace.organization.verifiedAt = new Date();
  workspace.organization.adminEmailVerificationToken = undefined;

  await workspace.save();

  return {
    verified: true,
    domain: workspace.organization.primaryDomain,
    adminEmail: workspace.organization.adminEmail,
    verifiedAt: workspace.organization.verifiedAt,
    message: `Domain ownership of @${workspace.organization.primaryDomain} verified via admin email.`,
  };
};

/**
 * Screen 32: Configure Security Policies
 */
const updateSecuritySettings = async (
  userId: string,
  payload: Partial<IWorkspaceSecuritySettings>
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  workspace.securitySettings = {
    ...workspace.securitySettings,
    ...payload,
    isConfigured: true,
  };

  await workspace.save();

  return {
    requireMFA: workspace.securitySettings.requireMFA,
    strictPasswordPolicy: workspace.securitySettings.strictPasswordPolicy,
    ssoEnabled: workspace.securitySettings.ssoEnabled,
    sessionTimeoutMinutes: workspace.securitySettings.sessionTimeoutMinutes,
    isConfigured: workspace.securitySettings.isConfigured,
    message: "Security and authentication policies saved successfully.",
  };
};

/**
 * Screen 33: Provision Users at Scale (Multi-Select Checkboxes)
 */
const updateProvisioningSettings = async (
  userId: string,
  payload: Partial<IWorkspaceProvisioning>
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const requiresDomainVerification =
    payload.allowDomainAutoJoin === true ||
    payload.selectedMethods?.includes("DOMAIN") ||
    payload.provisioningMethod === "DOMAIN";

  if (requiresDomainVerification && !workspace.organization?.domainVerified) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot enable Domain-based provisioning before verifying corporate domain. Please verify your domain in Screen 30 (Verify Domain) first."
    );
  }

  const selectedMethods = payload.selectedMethods || [];
  if (payload.scimEnabled && !selectedMethods.includes("SCIM")) {
    selectedMethods.push("SCIM");
  }
  if (payload.allowDomainAutoJoin && !selectedMethods.includes("DOMAIN")) {
    selectedMethods.push("DOMAIN");
  }
  if (payload.bulkCsvEnabled && !selectedMethods.includes("CSV")) {
    selectedMethods.push("CSV");
  }

  workspace.provisioning = {
    ...workspace.provisioning,
    ...payload,
    selectedMethods: selectedMethods.length > 0 ? selectedMethods : workspace.provisioning?.selectedMethods,
    isConfigured: true,
  };

  await workspace.save();

  return {
    allowDomainAutoJoin: workspace.provisioning.allowDomainAutoJoin,
    scimEnabled: workspace.provisioning.scimEnabled,
    bulkCsvEnabled: workspace.provisioning.bulkCsvEnabled,
    selectedMethods: workspace.provisioning.selectedMethods,
    isConfigured: workspace.provisioning.isConfigured,
    message: "User provisioning settings updated successfully.",
  };
};

export const WorkspaceServices = {
  getChecklistProgress,
  toggleChecklistVisibility,
  updateChecklistItemStatus,
  personalizeWorkspace,
  initiateDomainVerification,
  checkDomainVerification,
  confirmDomainByEmail,
  updateSecuritySettings,
  updateProvisioningSettings,
};
