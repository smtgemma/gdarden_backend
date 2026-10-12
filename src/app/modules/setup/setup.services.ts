import crypto from "crypto";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { OnboardingPath } from "../user/user.interface";
import { Workspace } from "../workspace/workspace.model";
import { Department } from "../department/department.model";
import { Team } from "../team/team.model";
import { WorkspaceInvitation } from "../invitation/invitation.model";
import {
  IAIGovernancePayload,
  IDepartmentStructurePayload,
  IInviteMemberItem,
  IOrganizationPayload,
  IProfileSetupPayload,
  ITeamWorkspacePayload,
} from "./setup.interface";
import { WorkspaceTier } from "../workspace/workspace.interface";
import { InvitationStatus } from "../invitation/invitation.interface";

const getSetupState = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let workspace = null;
  if (user.workspaceId) {
    workspace = await Workspace.findById(user.workspaceId);
  } else {
    workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  }

  let departments: any[] = [];
  let teams: any[] = [];
  let invitations: any[] = [];

  if (workspace) {
    [departments, teams, invitations] = await Promise.all([
      Department.find({ workspaceId: workspace._id, isDeleted: false }),
      Team.find({ workspaceId: workspace._id, isDeleted: false }),
      WorkspaceInvitation.find({ workspaceId: workspace._id, status: InvitationStatus.PENDING }),
    ]);
  }

  return {
    user,
    workspace,
    departments,
    teams,
    invitations,
    currentStep: user.onboardingCurrentStep || 1,
    path: user.onboardingPath || null,
    isCompleted: user.isSetupCompleted || false,
  };
};

const setupProfile = async (
  userId: string,
  payload: IProfileSetupPayload,
  file?: Express.MulterS3.File
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  user.name = payload.name;
  user.jobTitle = payload.jobTitle;
  user.primaryFunction = payload.primaryFunction;
  if (payload.primaryFunctionCustom) {
    user.primaryFunctionCustom = payload.primaryFunctionCustom;
  }
  if (file && (file as any).location) {
    user.avatar = (file as any).location;
  } else if (payload.avatar) {
    user.avatar = payload.avatar;
  }

  user.onboardingCurrentStep = Math.max(user.onboardingCurrentStep || 1, 2);

  await user.save();

  const { password: _, ...userWithoutPassword } = user.toObject();

  return userWithoutPassword;
};

const selectPath = async (userId: string, path: WorkspaceTier) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  let workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });

  if (!workspace) {
    workspace = await Workspace.create({
      name: `${user.name}'s Workspace`,
      tier: path,
      ownerId: user._id,
      modules: [],
    });
  } else {
    workspace.tier = path;
    await workspace.save();
  }

  user.onboardingPath = path as unknown as OnboardingPath;
  user.workspaceId = workspace._id;
  user.onboardingCurrentStep = 3;
  await user.save();

  return {
    workspace,
    onboardingPath: path,
    currentStep: 3,
  };
};

const setupTeamWorkspace = async (userId: string, payload: ITeamWorkspacePayload) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found. Please select a path first.");

  workspace.name = payload.workspaceName;
  workspace.teamName = payload.teamName;
  await workspace.save();

  await Team.findOneAndUpdate(
    { workspaceId: workspace._id, name: payload.teamName },
    {
      workspaceId: workspace._id,
      name: payload.teamName,
      createdBy: user._id,
    },
    { upsert: true, new: true }
  );

  user.onboardingCurrentStep = 4;
  await user.save();

  return workspace;
};

const setupOrganization = async (userId: string, payload: IOrganizationPayload) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found. Please select a path first.");

  workspace.name = payload.organizationName;
  workspace.organization = {
    name: payload.organizationName,
    industry: payload.industry,
    industryCustom: payload.industryCustom,
    size: payload.size,
    primaryDomain: payload.primaryDomain,
    domainVerified: false,
    domainVerificationToken: payload.primaryDomain ? crypto.randomBytes(16).toString("hex") : undefined,
  };

  await workspace.save();

  user.companyName = payload.organizationName;
  user.onboardingCurrentStep = 4;
  await user.save();

  return workspace;
};

const setupDepartmentsAndTeams = async (
  userId: string,
  payload: IDepartmentStructurePayload
) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const createdDepartments = [];
  const createdTeams = [];

  for (const item of payload.departments) {
    let dept = await Department.findOne({
      workspaceId: workspace._id,
      name: item.departmentName,
      isDeleted: false,
    });

    if (!dept) {
      dept = await Department.create({
        workspaceId: workspace._id,
        name: item.departmentName,
        description: item.description,
        createdBy: user._id,
      });
    }
    createdDepartments.push(dept);

    if (item.teams && item.teams.length > 0) {
      for (const teamName of item.teams) {
        let team = await Team.findOne({
          workspaceId: workspace._id,
          departmentId: dept._id,
          name: teamName,
          isDeleted: false,
        });

        if (!team) {
          team = await Team.create({
            workspaceId: workspace._id,
            departmentId: dept._id,
            name: teamName,
            createdBy: user._id,
          });
        }
        createdTeams.push(team);
      }
    }
  }

  user.onboardingCurrentStep = 5;
  await user.save();

  return {
    departments: createdDepartments,
    teams: createdTeams,
  };
};

const getDepartmentsAndTeams = async (userId: string) => {
  const workspace = await Workspace.findOne({ ownerId: userId, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const departments = await Department.find({ workspaceId: workspace._id, isDeleted: false });
  const teams = await Team.find({ workspaceId: workspace._id, isDeleted: false });

  return {
    departments,
    teams,
  };
};

const deleteDepartment = async (userId: string, departmentId: string) => {
  const workspace = await Workspace.findOne({ ownerId: userId, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const dept = await Department.findOne({
    _id: departmentId,
    workspaceId: workspace._id,
  });
  if (!dept) throw new AppError(httpStatus.NOT_FOUND, "Department not found");

  dept.isDeleted = true;
  await dept.save();

  await Team.updateMany(
    { workspaceId: workspace._id, departmentId: dept._id },
    { $set: { isDeleted: true } }
  );

  return { message: "Department and associated teams removed successfully" };
};

const setupModules = async (userId: string, modules: string[]) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  workspace.modules = modules;
  await workspace.save();

  if (workspace.tier === WorkspaceTier.INDIVIDUAL) {
    user.onboardingCurrentStep = 4;
  } else if (workspace.tier === WorkspaceTier.TEAM) {
    user.onboardingCurrentStep = 5;
  } else {
    user.onboardingCurrentStep = 6;
  }
  await user.save();

  return workspace;
};

const inviteMembers = async (userId: string, members: IInviteMemberItem[]) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  const invitations = [];

  for (const m of members) {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await WorkspaceInvitation.findOneAndUpdate(
      { workspaceId: workspace._id, email: m.email.toLowerCase() },
      {
        workspaceId: workspace._id,
        email: m.email.toLowerCase(),
        name: m.name,
        accessLevel: m.accessLevel,
        jobRole: m.jobRole,
        departmentId: m.departmentId || null,
        teamId: m.teamId || null,
        invitedBy: user._id,
        status: InvitationStatus.PENDING,
        token,
        expiresAt,
      },
      { upsert: true, new: true }
    );
    invitations.push(invite);
  }

  if (workspace.tier === WorkspaceTier.TEAM) {
    user.onboardingCurrentStep = 6;
  } else {
    user.onboardingCurrentStep = 7;
  }
  await user.save();

  return invitations;
};

const setupAIGovernance = async (userId: string, payload: IAIGovernancePayload) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  workspace.aiControl.globalLevel = payload.globalLevel;
  if (payload.governance) {
    workspace.aiControl.governance = {
      ...workspace.aiControl.governance,
      ...payload.governance,
    };
  }
  await workspace.save();

  if (workspace.tier === WorkspaceTier.INDIVIDUAL) {
    user.onboardingCurrentStep = 5;
  } else if (workspace.tier === WorkspaceTier.TEAM) {
    user.onboardingCurrentStep = 7;
  } else {
    user.onboardingCurrentStep = 8;
  }
  await user.save();

  return workspace;
};

const completeSetup = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const workspace = await Workspace.findOne({ ownerId: user._id, isDeleted: false });
  if (!workspace) throw new AppError(httpStatus.NOT_FOUND, "Workspace not found");

  workspace.isCompleted = true;
  await workspace.save();

  user.isSetupCompleted = true;
  user.workspaceId = workspace._id;
  await user.save();

  const [departmentsCount, teamsCount, invitationsCount] = await Promise.all([
    Department.countDocuments({ workspaceId: workspace._id, isDeleted: false }),
    Team.countDocuments({ workspaceId: workspace._id, isDeleted: false }),
    WorkspaceInvitation.countDocuments({ workspaceId: workspace._id, status: InvitationStatus.PENDING }),
  ]);

  return {
    message: "Workspace setup completed successfully. Welcome to OpsOS!",
    workspace: {
      id: workspace._id,
      name: workspace.name,
      tier: workspace.tier,
      modulesCount: workspace.modules.length,
      aiControlLevel: workspace.aiControl.globalLevel,
      departmentsCount,
      teamsCount,
      invitationsCount,
      isCompleted: true,
    },
  };
};

export const SetupServices = {
  getSetupState,
  setupProfile,
  selectPath,
  setupTeamWorkspace,
  setupOrganization,
  setupDepartmentsAndTeams,
  getDepartmentsAndTeams,
  deleteDepartment,
  setupModules,
  inviteMembers,
  setupAIGovernance,
  completeSetup,
};
