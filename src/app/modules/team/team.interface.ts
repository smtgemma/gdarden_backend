import { Types } from "mongoose";

export interface ITeam {
  _id?: Types.ObjectId;
  workspaceId: Types.ObjectId;
  departmentId?: Types.ObjectId | null;
  name: string;
  description?: string;
  leadId?: Types.ObjectId | null;
  createdBy?: Types.ObjectId;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
