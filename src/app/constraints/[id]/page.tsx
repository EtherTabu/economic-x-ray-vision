import { notFound } from "next/navigation";
import { ConstraintInvestigationWorkspace } from "@/components/ConstraintInvestigationWorkspace";
import { constraintRegistry } from "@/data/constraintRegistry";
import { buildConstraintInvestigation } from "@/lib/constraintInvestigation";
import { getConstraintsWithScores } from "@/lib/constraints";

type ConstraintInvestigationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return constraintRegistry.map((constraint) => ({
    id: constraint.id
  }));
}

export default async function ConstraintInvestigationPage({
  params
}: ConstraintInvestigationPageProps) {
  const { id } = await params;
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const constraint = scoredConstraints.find((item) => item.id === id);

  if (!constraint) {
    notFound();
  }

  const investigation = buildConstraintInvestigation(
    constraint,
    scoredConstraints
  );

  return <ConstraintInvestigationWorkspace investigation={investigation} />;
}
