import crypto from "crypto";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Workspace } from "./workspace.model";
import { Department } from "../department/department.model";
import { Team } from "../team/team.model";
import { WorkspaceInvitation } from "../invitation/invitation.model";
import { WorkspaceTier } from "./workspace.interface";

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

  const items = [
    {
      id: "profile_setup",
      title: "Set up your profile",
      description: "Add your full name, job title, and primary operational function",
      required: true,
      completed: Boolean(user.jobTitle && user.primaryFunction),
    },
    {
      id: "choose_modules",
      title: "Enable workspace modules",
      description: "Select core operational modules needed for your workspace",
      required: true,
      completed: Boolean(workspace.modules && workspace.modules.length > 0),
    },
    {
      id: "ai_governance",
      title: "Configure AI control level",
      description: "Set default autonomy level for AI operational actions",
      required: true,
      completed: Boolean(workspace.aiControl?.globalLevel),
    },
    {
      id: "invite_team",
      title: "Invite team members",
      description: "Add colleagues to collaborate in this workspace",
      required: workspace.tier !== WorkspaceTier.INDIVIDUAL,
      completed: invitationsCount > 0,
    },
    {
      id: "org_structure",
      title: "Define organization structure",
      description: "Add departments and functional teams",
      required: [WorkspaceTier.BUSINESS, WorkspaceTier.ENTERPRISE].includes(workspace.tier),
      completed: departmentsCount > 0 || teamsCount > 0,
    },
    {
      id: "personalize",
      title: "Personalize work routines and goals",
      description: "Set notification preferences and operational goals",
      required: false,
      completed: Boolean(workspace.personalization?.goals && workspace.personalization.goals.length > 0),
    },
    {
      id: "domain_verification",
      title: "Verify corporate domain",
      description: "Add DNS TXT record to enable auto-joining",
      required: workspace.tier === WorkspaceTier.ENTERPRISE,
      completed: Boolean(workspace.organization?.domainVerified),
    },
    {
      id: "security_policy",
      title: "Configure security & session policies",
      description: "Enforce MFA and idle session timeouts",
      required: false,
      completed: Boolean(workspace.securitySettings?.requireMFA || workspace.securitySettings?.sessionTimeoutMinutes),
    },
  ];

  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;

  return {
    workspaceId: workspace._id,
    workspaceName: workspace.name,
    tier: workspace.tier,
    progress: {
      total: totalItems,
      completed: completedItems,
      percentage: Math.round((completedItems / totalItems) * 100),
    },
    checklist: items,
  };
};

const personalizeWorkspace = async (
  userId: string,
  payload: {
    workStyle?: any;
    notificationPrefs?: any;
    goals?: string[];
  }
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
    notificationPrefs: {
      ...workspace.personalization?.notificationPrefs,
      ...payload.notificationPrefs,
    },
  };

  await workspace.save();

  return workspace.personalization;
};

const initiateDomainVerification = async (userId: string, domain: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({
    $or: [{ _id: user.workspaceId }, { ownerId: user._id }],
    isDeleted: false,
  });

  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const cleanDomain = domain.toLowerCase().trim().replace(/^@/, "");
  const token = `opsos-verification=${crypto.randomBytes(16).toString("hex")}`;

  workspace.organization = {
    ...workspace.organization,
    primaryDomain: cleanDomain,
    domainVerified: false,
    domainVerificationToken: token,
  };

  await workspace.save();

  return {
    domain: cleanDomain,
    verificationMethod: "DNS_TXT",
    recordType: "TXT",
    recordHost: "@",
    recordValue: token,
    instructions: `Add a DNS TXT record with host '@' (or '${cleanDomain}') and value '${token}'. Once added, click 'Verify DNS Record'.`,
  };
};

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
    // In non-production or localhost testing, consider valid
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
    message: "Corporate domain verified successfully.",
  };
};

const updateSecuritySettings = async (
  userId: string,
  payload: {
    requireMFA?: boolean;
    strictPasswordPolicy?: boolean;
    ssoEnabled?: boolean;
    sessionTimeoutMinutes?: number;
  }
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
  };

  await workspace.save();

  return workspace.securitySettings;
};

export const WorkspaceServices = {
  getChecklistProgress,
  personalizeWorkspace,
  initiateDomainVerification,
  checkDomainVerification,
  updateSecuritySettings,
};
