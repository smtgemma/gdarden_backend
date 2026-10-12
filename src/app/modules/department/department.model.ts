import { Schema, model } from "mongoose";
import { IDepartment } from "./department.interface";

const departmentSchema = new Schema<IDepartment>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

departmentSchema.index({ workspaceId: 1, name: 1 });

export const Department = model<IDepartment>("Department", departmentSchema);
