import { notFound } from "next/navigation";
import { ValidationCampaignDetailWorkspace } from "@/components/ValidationCampaignDetailWorkspace";
import { constraintRegistry } from "@/data/constraintRegistry";
import { getConstraintsWithScores } from "@/lib/constraints";
import {
  buildValidationCampaignDetailPortfolio,
  findValidationCampaignDetail
} from "@/lib/validationCampaignDetails";

type CampaignDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildValidationCampaignDetailPortfolio(scoredConstraints);

  return portfolio.details.map((detail) => ({
    id: detail.campaign.campaign_id
  }));
}

export default async function CampaignDetailPage({
  params
}: CampaignDetailPageProps) {
  const { id } = await params;
  const scoredConstraints = getConstraintsWithScores(constraintRegistry);
  const portfolio = buildValidationCampaignDetailPortfolio(scoredConstraints);
  const detail = findValidationCampaignDetail(portfolio, id);

  if (!detail) {
    notFound();
  }

  return <ValidationCampaignDetailWorkspace detail={detail} />;
}
