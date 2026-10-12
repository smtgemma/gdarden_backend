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

export const WorkspaceValidation = {
  personalizeValidationSchema,
};
