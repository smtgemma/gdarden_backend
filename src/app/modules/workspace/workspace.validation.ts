import { z } from "zod";
import { WorkStylePreference } from "./workspace.interface";

const personalizeValidationSchema = z.object({
  workStyle: z.nativeEnum(WorkStylePreference).optional(),
  notificationPrefs: z
    .object({
      assignedWork: z.boolean().optional(),
      teamUpdates: z.boolean().optional(),
      dueDates: z.boolean().optional(),
      incidents: z.boolean().optional(),
    })
    .optional(),
  goals: z.array(z.string().min(1)).optional(),
});

const domainInitiateValidationSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .transform((val) => val.trim().replace(/^@/, ""))
    .refine(
      (val) => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
      "Please enter a valid domain format (e.g. acme.com)"
    ),
  verificationMethod: z.enum(["DNS_TXT", "EMAIL_ADMIN", "BOTH"]).optional(),
  adminEmail: z.string().email("Please provide a valid admin email").optional(),
});

const domainEmailConfirmValidationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

const securityValidationSchema = z.object({
  requireMFA: z.boolean().optional(),
  strictPasswordPolicy: z.boolean().optional(),
  ssoEnabled: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().positive("Timeout must be a positive number").optional(),
});

const provisioningValidationSchema = z.object({
  allowDomainAutoJoin: z.boolean().optional(),
  scimEnabled: z.boolean().optional(),
  bulkCsvEnabled: z.boolean().optional(),
  selectedMethods: z.array(z.enum(["SCIM", "DOMAIN", "CSV", "EMAIL"])).optional(),
  provisioningMethod: z.enum(["EMAIL", "DOMAIN", "SCIM", "CSV"]).optional(),
});

const checklistVisibilityValidationSchema = z.object({
  hidden: z.boolean(),
});

const checklistItemUpdateValidationSchema = z.object({
  completed: z.boolean(),
});

export const WorkspaceValidation = {
  personalizeValidationSchema,
  domainInitiateValidationSchema,
  domainEmailConfirmValidationSchema,
  securityValidationSchema,
  provisioningValidationSchema,
  checklistVisibilityValidationSchema,
  checklistItemUpdateValidationSchema,
};
