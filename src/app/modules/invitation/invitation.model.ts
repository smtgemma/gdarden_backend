import { Schema, model } from "mongoose";
import {
  IWorkspaceInvitation,
  InvitationAccessLevel,
  InvitationStatus,
} from "./invitation.interface";

const workspaceInvitationSchema = new Schema<IWorkspaceInvitation>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    accessLevel: {
      type: String,
      enum: Object.values(InvitationAccessLevel),
      default: InvitationAccessLevel.MEMBER,
    },
    jobRole: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

workspaceInvitationSchema.index({ workspaceId: 1, email: 1, status: 1 });
workspaceInvitationSchema.index({ token: 1 });

export const WorkspaceInvitation = model<IWorkspaceInvitation>(
  "WorkspaceInvitation",
  workspaceInvitationSchema
);
