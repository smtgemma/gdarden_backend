
import httpStatus from "http-status-codes";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { AccountStatus, AccountType, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import { userFilterableFields, userSearchableFields } from "./user.constant";
import { QueryBuilder } from "../../utils/QueryBuiler";
import { JwtPayload } from "jsonwebtoken";
import bcryptjs from 'bcryptjs';
import { deleteFileFromS3 } from "../../config/S3Client.config";
import { generateOtp } from "../otp/otp.service";
import { sendEmail } from "../../utils/sendEmail";
import { redisClient } from "../../config/redis.config";
import mongoose from "mongoose";

const createUser = async (payload: Partial<IUser>, creatorToken?: JwtPayload) => {
  const { email, password, accountType, department, ...rest } = payload;

  // 🔴 STRICT PRIVILEGE ESCALATION PROTECTION FOR PUBLIC REGISTRATION
  if (!creatorToken) {
    delete (rest as any).role;
    delete (rest as any).status;
    delete (rest as any).organizationId;
    delete (rest as any).isVerified;
    delete (rest as any).isActive;
    delete (rest as any).isDeleted;
  }

  const isUserExist = await User.findOne({ email });
  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  let role = Role.USER;
  let organizationId = null;
  const assignedDepartment = department || (accountType === AccountType.ORGANIZATION ? "Organization" : "Personal Account");

  const isSelfOrgRegistration = accountType === AccountType.ORGANIZATION && !creatorToken;

  if (isSelfOrgRegistration) {
    role = Role.ORGANIZATION_ADMIN;
  }

  if (creatorToken) {
    if (creatorToken.role === Role.SUPER_ADMIN) {
      role = payload.role || Role.SUPER_ADMIN;
      organizationId = payload.organizationId || null;
    } else if (creatorToken.role === Role.ORGANIZATION_ADMIN) {
      organizationId = creatorToken.userId;
      if (payload.role === Role.DEPARTMENT_ADMIN) {
        role = Role.DEPARTMENT_ADMIN;
      }
    } else if (creatorToken.role === Role.DEPARTMENT_ADMIN) {
      organizationId = creatorToken.organizationId;
      role = Role.USER;
    }
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const status = isSelfOrgRegistration
    ? AccountStatus.PENDING
    : AccountStatus.APPROVED;

  const user = await User.create({
    email,
    password: hashedPassword,
    accountType: organizationId ? AccountType.INDIVIDUAL : accountType,
    role,
    status,
    department: assignedDepartment,
    organizationId,
    createdBy: creatorToken ? creatorToken.userId : null,
    ...rest,
  });

  const redisKey = `otp:${user.email}`;
  const otp = generateOtp();

  await redisClient.set(redisKey, otp, {
    expiration: { type: "EX", value: 120 },
  });

  await sendEmail({
    to: user.email,
    subject: "Account Verification OTP",
    templateName: "otp",
    templateData: {
      name: user.name,
      otp,
    },
  });

  return { user };
};

const getAllUsers = async (
  query: Record<string, string>,
  decodedToken: JwtPayload
) => {
  const filter: any = {};

  // =====================================
  // 🔐 STRICT ROLE BASED DATA ISOLATION
  // =====================================

  // 1. SUPER_ADMIN: সব দেখতে পারবে, তবে চাইলে নির্দিষ্ট organization ফিল্টার করতে পারবে
  if (decodedToken.role === Role.SUPER_ADMIN) {
    if (query.organizationId === "null") {
      filter.organizationId = null;
      filter.accountType = AccountType.INDIVIDUAL;
      // For global user management, super admin only wants to see SUPER_ADMIN and USER roles by default
      if (!query.role) {
        filter.role = { $in: [Role.SUPER_ADMIN, Role.USER] };
      }
    } else if (query.organizationId) {
      filter.organizationId = query.organizationId;
    }
  }

  // 2. ORGANIZATION_ADMIN: শুধুমাত্র নিজের অর্গানাইজেশনের ইউজার এবং DA দেখতে পারবে
  if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
    filter.organizationId = decodedToken.userId;
  }

  // 3. DEPARTMENT_ADMIN: নিজের অর্গানাইজেশনের এবং শুধুমাত্র নিজের ডিপার্টমেন্টের ইউজারদের দেখতে পারবে
  if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
    filter.organizationId = decodedToken.organizationId;
    filter.department = decodedToken.department;
    filter._id = { $ne: decodedToken.userId };
  }

  // 4. REGULAR USER: নিজের অর্গানাইজেশনের অন্য ইউজারদের দেখতে পারবে
  if (decodedToken.role === Role.USER) {
    filter.organizationId = decodedToken.organizationId;
    filter.role = Role.USER; // সাধারণ ইউজারদের Admin দের দেখার দরকার নেই
    filter._id = { $ne: decodedToken.userId };
  }

  // Prevent QueryBuilder from using organizationId from raw query
  delete query.organizationId;

  const queryBuilder = new QueryBuilder(User.find(filter), query);

  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    usersData.getMeta(),
  ]);

  return { data, meta };
};

const approveOrganization = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.accountType !== AccountType.ORGANIZATION) {
    throw new AppError(httpStatus.BAD_REQUEST, "Not an organization account");
  }

  user.status = AccountStatus.APPROVED;
  user.role = Role.ORGANIZATION_ADMIN;

  await user.save();

  // Send registration success/approval confirmation email
  sendEmail({
    to: user.email,
    subject: "Successful Registration - Welcome to Gdarden",
    templateName: "registrationSuccess",
    templateData: {
      name: user.name,
      email: user.email,
      phone: user.phone || "N/A",
      companyName: user.companyName || "N/A",
      accountType: user.accountType,
      senderName: "Gdarden Team",
    },
  }).catch((err) => console.error("Email approval notification failed:", err));

  return user;
};

const rejectOrganization = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.accountType !== AccountType.ORGANIZATION) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only organization accounts can be rejected"
    );
  }

  user.status = AccountStatus.REJECTED;
  user.role = Role.USER; // fallback safe role

  await user.save();

  return user;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId)
    .populate("organizationId", "name email picture companyName")
    .select("-password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return {
    data: user
  };
};


const getS3KeyFromUrl = (url: string) => {
  const parts = url.split(`/${envVars.S3.S3_BUCKET_NAME}/`);
  return parts[1] ?? "";
};

const updateMyProfile = async ({
  userId,
  payload,
  decodedToken,
  file,
  oldPassword,
  newPassword,
  confirmPassword,
}: any) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");

  // Authorization check
  if (decodedToken.role === "USER" && decodedToken.userId !== userId) {
    throw new AppError(403, "You are not authorized");
  }

  // ===============================
  // 🔐 ONLY ALLOWED FIELDS
  // ===============================
  const allowedFields = ["name", "department", "accountType", "phone", "companyName"];

  const filteredPayload: any = {};

  Object.keys(payload).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredPayload[key] = payload[key];
    }
  });

  // ===============================
  // 🔐 PASSWORD UPDATE (SAFE)
  // ===============================
  if (oldPassword || newPassword || confirmPassword) {
    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new AppError(400, "All password fields are required");
    }

    const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword);
    if (!isStrongPassword) {
      throw new AppError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }

    if (newPassword !== confirmPassword) {
      throw new AppError(400, "Passwords do not match");
    }

    const isOldPasswordMatch = await bcryptjs.compare(
      oldPassword,
      user.password as string
    );

    if (!isOldPasswordMatch) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Old password is incorrect");
    }

    filteredPayload.password = await bcryptjs.hash(
      newPassword,
      Number(envVars.BCRYPT_SALT_ROUND || 10)
    );
  }

  // ===============================
  // 🖼️ PROFILE PICTURE UPDATE
  // ===============================
  if (file) {
    if (user.picture) {
      const oldKey = getS3KeyFromUrl(user.picture);
      if (oldKey) await deleteFileFromS3(oldKey);
    }

    filteredPayload.picture = file.location;
  }

  // ===============================
  // 🚀 UPDATE USER
  // ===============================
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    filteredPayload,
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedUser;
};

const deleteOwnAccount = async (userId: string) => {

  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  if (user.role === Role.ORGANIZATION_ADMIN) {
    await User.deleteMany({ organizationId: user._id });
  }

  await User.findByIdAndDelete(userId);

  return { message: "Your account has been deleted successfully" };
};

const deleteAllUsers = async (decodedToken: JwtPayload) => {
  if (!decodedToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  let filter: Record<string, unknown> = {};

  if (decodedToken.role === Role.SUPER_ADMIN) {
    throw new AppError(httpStatus.BAD_REQUEST, "Global user deletion is disabled. Please specify a tenant organization.");
  } else if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
    filter = { organizationId: decodedToken.userId };
  } else {
    throw new AppError(httpStatus.FORBIDDEN, "You do not have permission to delete bulk users.");
  }

  const result = await User.deleteMany(filter);
  return result;
};

const getSingleUser = async (id: string, decodedToken: JwtPayload) => {
  const user = await User.findById(id).select("-password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (GET)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    // If the target user is an Organization Admin, their _id is the organizationId
    const targetOrgId = user.organizationId?.toString() || user._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN
      ? decodedToken.userId?.toString()
      : decodedToken.organizationId?.toString();

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(httpStatus.FORBIDDEN, "Not authorized to view users from another organization");
    }

    // We allow viewing details of any user in the same organization (tenant isolation is checked above)
  }

  return {
    data: user
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new AppError(404, "User Not Found");
  }

  // Normal user cannot update others
  if (decodedToken.role === Role.USER) {
    throw new AppError(403, "Not authorized");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (UPDATE)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    if (targetUser.role === Role.SUPER_ADMIN) {
      throw new AppError(403, "Cannot modify Super Admin");
    }

    const targetOrgId = targetUser.organizationId?.toString() || targetUser._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN
      ? decodedToken.userId?.toString()
      : decodedToken.organizationId?.toString();

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(403, "Cannot modify users from another organization");
    }

    if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      if (targetUser.department !== decodedToken.department) {
        throw new AppError(403, "Cannot modify users from another department");
      }
    }
  }

  // Sanitize protected fields and enforce role transition rules
  const sanitizedPayload: Partial<IUser> = { ...payload };

  if (decodedToken.role !== Role.SUPER_ADMIN) {
    delete sanitizedPayload.isDeleted;
    delete sanitizedPayload.isVerified;
    delete sanitizedPayload.isActive;
  }

  if (sanitizedPayload.role && sanitizedPayload.role !== targetUser.role) {
    if (decodedToken.role !== Role.SUPER_ADMIN) {
      if (sanitizedPayload.role === Role.SUPER_ADMIN) {
        throw new AppError(403, "Cannot promote user to Super Admin");
      }
      if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
        throw new AppError(403, "Department Admin is not authorized to change user roles");
      }
      if (decodedToken.role === Role.ORGANIZATION_ADMIN) {
        if (sanitizedPayload.role !== Role.DEPARTMENT_ADMIN && sanitizedPayload.role !== Role.USER) {
          throw new AppError(403, "Organization Admin can only assign Department Admin or User roles");
        }
      }
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    sanitizedPayload,
    { new: true, runValidators: true }
  );

  return updatedUser;
};

const deleteUserById = async (
  id: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // ==========================================
  // 🔐 CROSS-TENANT DATA ISOLATION (DELETE)
  // ==========================================
  if (decodedToken.role !== Role.SUPER_ADMIN) {
    if (user.role === Role.SUPER_ADMIN) {
      throw new AppError(403, "Cannot delete Super Admin");
    }

    const targetOrgId = user.organizationId?.toString() || user._id.toString();
    const requesterOrgId = decodedToken.role === Role.ORGANIZATION_ADMIN
      ? decodedToken.userId?.toString()
      : decodedToken.organizationId?.toString();

    if (targetOrgId !== requesterOrgId) {
      throw new AppError(403, "Cannot delete users from another organization");
    }

    if (decodedToken.role === Role.DEPARTMENT_ADMIN) {
      if (user.department !== decodedToken.department) {
        throw new AppError(403, "Cannot delete users from another department");
      }
    }
  }

  if (user.role === Role.ORGANIZATION_ADMIN) {
    await User.deleteMany({ organizationId: user._id });
  }

  await User.findByIdAndDelete(id);

  return user;
};

const getUserBySlug = async (slug: string) => {
  const cleanSearch = slug.replace(/-/g, "[\\s-_]?");
  const searchRegex = new RegExp(`^${cleanSearch}$`, "i");

  // Try direct index/regex match first
  let matchingOrg = await User.findOne({
    accountType: AccountType.ORGANIZATION,
    $or: [{ companyName: searchRegex }, { name: searchRegex }]
  }).lean();

  if (!matchingOrg) {
    // Fallback: Query only candidates matching first letter/word to avoid full DB load
    const slugify = (text: string): string => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    };

    const firstChar = slug.charAt(0);
    const orgs = await User.find({
      accountType: AccountType.ORGANIZATION,
      $or: [
        { companyName: new RegExp(`^${firstChar}`, "i") },
        { name: new RegExp(`^${firstChar}`, "i") }
      ]
    }).lean();

    matchingOrg = orgs.find(org => slugify(org.companyName || org.name) === slug) || null;
  }

  if (!matchingOrg) {
    throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
  }

  return matchingOrg;
};

export const UserServices = {
  createUser,
  approveOrganization,
  rejectOrganization,
  getAllUsers,
  getMe,
  getSingleUser,
  getUserBySlug,
  updateUser,
  updateMyProfile,
  deleteOwnAccount,
  deleteUserById,
  deleteAllUsers
};
