import { intakeConstraints } from "@/data/generated/intakeConstraints";
import { healthcareConstraints } from "@/data/healthcareConstraints";
import type { ConstraintIntelligenceObject } from "@/types/constraint";

export const constraintRegistry: ConstraintIntelligenceObject[] = [
  ...healthcareConstraints,
  ...intakeConstraints
];
