import { Types } from "mongoose";

export enum InvitationAccessLevel {
  ADMINISTRATOR = "Administrator",
  MANAGER = "Manager",
  MEMBER = "Member",
}

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

export interface IWorkspaceInvitation {
  _id?: Types.ObjectId;
  workspaceId: Types.ObjectId;
  email: string;
  name?: string;
  accessLevel: InvitationAccessLevel;
  jobRole?: string;
  departmentId?: Types.ObjectId | null;
  teamId?: Types.ObjectId | null;
  invitedBy: Types.ObjectId;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
