import { model, Schema } from "mongoose";
import { AccountStatus, AccountType, IAuthProvider, IsActive, IUser, OnboardingPath, Role } from "./user.interface";
import { Types } from "mongoose";

const authProviderSchema = new Schema<IAuthProvider>({
    provider: { type: String, required: true },
    providerId: { type: String, required: true }
}, {
    versionKey: false,
    _id: false
});

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    fullName: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
        type: String,
        enum: Object.values(Role),
        default: Role.USER
    },
    department: { type: String, required: false, default: "Personal Account" },
    phone: { type: String, required: false },
    companyName: { type: String, required: false },
    jobTitle: { type: String, default: null },
    primaryFunction: { type: String, default: null },
    primaryFunctionCustom: { type: String, default: null },
    accountType: {
        type: String,
        enum: Object.values(AccountType),
        default: AccountType.INDIVIDUAL
    },
    status: {
        type: String,
        enum: Object.values(AccountStatus),
        default: AccountStatus.APPROVED,
    },

    picture: { type: String },
    avatar: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    isActive: {
        type: String,
        enum: Object.values(IsActive),
        default: IsActive.ACTIVE,
    },
    isVerified: { type: Boolean, default: false },
    auths: [authProviderSchema],

    // 🚀 OpsOS Workspace & Onboarding Progress
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", default: null },
    onboardingPath: {
        type: String,
        enum: Object.values(OnboardingPath),
        default: null,
    },
    onboardingCurrentStep: { type: Number, default: 1 },
    isSetupCompleted: { type: Boolean, default: false },

    // Multi-Tenant Isolation
    organizationId: { type: Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Types.ObjectId, ref: "User", default: null },
}, {
    timestamps: true,
    versionKey: false
});

userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ department: 1, organizationId: 1 });
userSchema.index({ accountType: 1, status: 1, isDeleted: 1 });
userSchema.index({ workspaceId: 1 });

export const User = model<IUser>("User", userSchema);