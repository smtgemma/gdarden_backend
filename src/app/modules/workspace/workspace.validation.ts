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
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please enter a valid domain format (e.g. acme.com)"),
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
  provisioningMethod: z.enum(["EMAIL", "DOMAIN", "SCIM", "CSV"]).optional(),
});

export const WorkspaceValidation = {
  personalizeValidationSchema,
  domainInitiateValidationSchema,
  securityValidationSchema,
  provisioningValidationSchema,
};
