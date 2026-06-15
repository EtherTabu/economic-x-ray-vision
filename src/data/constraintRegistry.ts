import { intakeConstraints } from "@/data/generated/intakeConstraints";
import { healthcareConstraints } from "@/data/healthcareConstraints";
import { strategicConstraintSeeds } from "@/data/strategicConstraintSeeds";
import type { ConstraintIntelligenceObject } from "@/types/constraint";

export const constraintRegistry: ConstraintIntelligenceObject[] = [
  ...healthcareConstraints,
  ...intakeConstraints,
  ...strategicConstraintSeeds
];
