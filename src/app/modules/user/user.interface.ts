import { Types } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN",
  DEPARTMENT_ADMIN = "DEPARTMENT_ADMIN",
  USER = "USER",
}

export enum AccountType {
  ORGANIZATION = "ORGANIZATION",
  INDIVIDUAL = "INDIVIDUAL",
}

export enum AccountStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum OnboardingPath {
  INDIVIDUAL = "INDIVIDUAL",
  TEAM = "TEAM",
  BUSINESS = "BUSINESS",
  ENTERPRISE = "ENTERPRISE",
}

export interface IAuthProvider {
  provider: "google" | "credentials";
  providerId: string;
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  password?: string;
  picture?: string;
  avatar?: string;
  jobTitle?: string;
  primaryFunction?: string;
  primaryFunctionCustom?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  role: Role;
  department: string;
  phone?: string;
  companyName?: string;
  accountType: AccountType;
  status: AccountStatus;
  auths: IAuthProvider[];

  // 🚀 OpsOS Workspace & Onboarding Progress
  workspaceId?: Types.ObjectId;
  onboardingPath?: OnboardingPath | null;
  onboardingCurrentStep?: number;
  isSetupCompleted?: boolean;

  // Multi-Tenant Isolation
  organizationId?: Types.ObjectId;
  createdBy?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}
