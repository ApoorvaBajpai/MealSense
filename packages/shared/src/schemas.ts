import { z } from "zod";

export const UserRoleSchema = z.enum(["student", "kitchen", "admin"]);
export const MealTypeSchema = z.enum(["breakfast", "lunch", "snacks", "dinner"]);
export const MealStatusSchema = z.enum(["draft", "published", "locked", "served", "closed", "cancelled"]);
export const MealResponseSchema = z.enum(["eat", "skip"]);
export const ResponseSourceSchema = z.enum(["manual", "bulk", "away", "link"]);
export const AttendanceMethodSchema = z.enum(["tally", "register", "token", "biometric"]);
export const WasteTypeSchema = z.enum(["not_served", "uneaten", "spoiled"]);

export const SubmitResponseInputSchema = z.object({
  mealId: z.string().uuid(),
  response: MealResponseSchema,
  source: ResponseSourceSchema.default("manual"),
});

export const SetAwayInputSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
}).refine(data => data.toDate >= data.fromDate, {
  message: "End date must be on or after start date",
  path: ["toDate"],
});

export const RecordAttendanceInputSchema = z.object({
  mealId: z.string().uuid(),
  actualCount: z.number().int().nonnegative(),
  method: AttendanceMethodSchema.default("tally"),
  batches: z.array(z.record(z.any())).default([]),
});

export const RecordPreparationInputSchema = z.object({
  mealId: z.string().uuid(),
  preparedServings: z.number().int().nonnegative(),
  followedRecommendation: z.boolean(),
  ranShort: z.boolean().default(false),
  shortNote: z.string().nullable().optional(),
});

export const WasteItemSchema = z.object({
  wasteType: WasteTypeSchema,
  category: z.string().default("general"),
  quantityKg: z.number().nonnegative(),
  servingsEst: z.number().int().nonnegative().nullable().optional(),
  donated: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export const RecordWasteInputSchema = z.object({
  mealId: z.string().uuid(),
  records: z.array(WasteItemSchema),
});
