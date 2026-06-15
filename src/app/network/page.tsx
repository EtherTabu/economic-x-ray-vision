import { ConstraintNetworkExplorer } from "@/components/ConstraintNetworkExplorer";
import { constraintRegistry } from "@/data/constraintRegistry";
import { getConstraintsWithScores } from "@/lib/constraints";
import { buildConstraintNetwork } from "@/lib/constraintNetwork";

export default function NetworkPage() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const network = buildConstraintNetwork(scoredConstraints);

  return <ConstraintNetworkExplorer network={network} />;
}
