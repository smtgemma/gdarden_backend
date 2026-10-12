import { z } from "zod";
import { AccountType, IsActive, Role } from "./user.interface";

export const strongPasswordSchema = z
  .string()
  .min(12, { message: "Password must be at least 12 characters long." })
  .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter." })
  .regex(/[a-z]/, { message: "Password must contain at least 1 lowercase letter." })
  .regex(/[0-9]/, { message: "Password must contain at least 1 number." })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least 1 special character." });

export const createUserZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name cannot exceed 50 characters." }),
  email: z
    .string()
    .email({ message: "Invalid email address format." })
    .min(5, { message: "Email must be at least 5 characters long." })
    .max(100, { message: "Email cannot exceed 100 characters." }),
  password: strongPasswordSchema,
  department: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  accountType: z.enum([AccountType.INDIVIDUAL, AccountType.ORGANIZATION]).optional(),
});

export const registerUserZodSchema = createUserZodSchema.strict();

export const updateUserZodSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }).max(50, { message: "Name cannot exceed 50 characters." }).optional(),
  phone: z.string()
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  companyName: z.string().optional(),
  role: z.enum(Object.values(Role) as [string, ...string[]]).optional(),
  picture: z.any().optional(),
  department: z.string().optional()
});
