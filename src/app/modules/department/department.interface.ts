import { Types } from "mongoose";

export interface IDepartment {
  _id?: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  createdBy?: Types.ObjectId;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
