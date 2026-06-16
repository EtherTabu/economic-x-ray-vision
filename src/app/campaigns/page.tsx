import { ValidationCampaignPlanner } from "@/components/ValidationCampaignPlanner";
import { constraintRegistry } from "@/data/constraintRegistry";
import { getConstraintsWithScores } from "@/lib/constraints";
import { buildValidationCampaignPortfolio } from "@/lib/validationCampaigns";

export default function CampaignsPage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildValidationCampaignPortfolio(scoredConstraints);

  return <ValidationCampaignPlanner portfolio={portfolio} />;
}
