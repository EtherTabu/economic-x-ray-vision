import {
  buildConstraintComparisonPortfolio,
  type ConstraintComparisonRecord
} from "@/lib/constraintComparison";
import { buildConstraintNetwork, type ConstraintNetworkEdge } from "@/lib/constraintNetwork";
import {
  artifactNeedsForConstraint,
  buildEvidenceArtifactLibrary,
  type EvidenceArtifactNeed
} from "@/lib/evidenceArtifacts";
import { buildEvidencePackPortfolio, type EvidencePack } from "@/lib/evidencePacks";
import {
  buildValidationCampaignPortfolio,
  type ValidationCampaign,
  type ValidationCampaignConstraint
} from "@/lib/validationCampaigns";
import {
  buildValidationEvidencePacketPortfolio,
  type ValidationEvidencePacket
} from "@/lib/validationEvidencePackets";
import { buildValidationTaskPortfolio } from "@/lib/validationTasks";
import {
  buildValidationTriagePortfolio,
  type ConstraintValidationTriage
} from "@/lib/validationTriage";
import type { ScoredConstraint } from "@/types/constraint";

export type CampaignDetailConstraint = {
  rank: number;
  campaign_constraint: ValidationCampaignConstraint;
  triage?: ConstraintValidationTriage;
  packet?: ValidationEvidencePacket;
  evidence_pack?: EvidencePack;
  comparison?: ConstraintComparisonRecord;
  network_edges: ConstraintNetworkEdge[];
  artifact_needs: EvidenceArtifactNeed[];
  required_artifacts: string[];
  source_upgrades_needed: string[];
  success_criteria: string[];
  failure_criteria: string[];
  relationship_gaps: string[];
};

export type ValidationCampaignDetail = {
  campaign: ValidationCampaign;
  constraints: CampaignDetailConstraint[];
  summary: {
    selected_constraints: number;
    unique_industries: number;
    required_artifacts: number;
    source_records: number;
    expected_total_lift: number;
    relationship_gap_count: number;
  };
};

export type ValidationCampaignDetailPortfolio = {
  details: ValidationCampaignDetail[];
};

export function buildValidationCampaignDetailPortfolio(
  constraints: ScoredConstraint[]
): ValidationCampaignDetailPortfolio {
  const campaignPortfolio = buildValidationCampaignPortfolio(constraints);
  const taskPortfolio = buildValidationTaskPortfolio(constraints);
  const triagePortfolio = buildValidationTriagePortfolio(taskPortfolio.tasks);
  const packetPortfolio = buildValidationEvidencePacketPortfolio(triagePortfolio);
  const evidencePackPortfolio = buildEvidencePackPortfolio(constraints);
  const comparisonPortfolio = buildConstraintComparisonPortfolio(constraints);
  const network = buildConstraintNetwork(constraints);
  const artifactLibrary = buildEvidenceArtifactLibrary(constraints);

  const triageByConstraint = new Map(
    triagePortfolio.constraint_triage.map((triage) => [triage.constraint_id, triage])
  );
  const packetByConstraint = new Map(
    packetPortfolio.packets.map((packet) => [packet.constraint_id, packet])
  );
  const evidencePackByConstraint = new Map(
    evidencePackPortfolio.packs.map((pack) => [pack.constraint_id, pack])
  );
  const comparisonByConstraint = new Map(
    comparisonPortfolio.records.map((record) => [record.id, record])
  );

  return {
    details: campaignPortfolio.campaigns.map((campaign) => {
      const campaignConstraints = campaign.selected_constraints.map(
        (campaignConstraint, index) =>
          buildCampaignDetailConstraint({
            artifactNeeds: artifactNeedsForConstraint(
              artifactLibrary,
              campaignConstraint.constraint_id
            ),
            campaignConstraint,
            comparison: comparisonByConstraint.get(campaignConstraint.constraint_id),
            evidencePack: evidencePackByConstraint.get(campaignConstraint.constraint_id),
            networkEdges: networkEdgesFor(
              network.edges,
              campaignConstraint.constraint_id
            ),
            packet: packetByConstraint.get(campaignConstraint.constraint_id),
            rank: index + 1,
            triage: triageByConstraint.get(campaignConstraint.constraint_id)
          })
      );

      return {
        campaign,
        constraints: campaignConstraints,
        summary: summarizeCampaignDetail(campaign, campaignConstraints)
      };
    })
  };
}

export function findValidationCampaignDetail(
  portfolio: ValidationCampaignDetailPortfolio,
  id: string
) {
  const decodedId = decodeURIComponent(id);

  return portfolio.details.find(
    (detail) =>
      detail.campaign.campaign_id === decodedId ||
      detail.campaign.mode === decodedId ||
      detail.campaign.campaign_id.endsWith(`:${decodedId}`)
  );
}

function buildCampaignDetailConstraint({
  artifactNeeds,
  campaignConstraint,
  comparison,
  evidencePack,
  networkEdges,
  packet,
  rank,
  triage
}: {
  artifactNeeds: EvidenceArtifactNeed[];
  campaignConstraint: ValidationCampaignConstraint;
  comparison?: ConstraintComparisonRecord;
  evidencePack?: EvidencePack;
  networkEdges: ConstraintNetworkEdge[];
  packet?: ValidationEvidencePacket;
  rank: number;
  triage?: ConstraintValidationTriage;
}): CampaignDetailConstraint {
  const relationshipGaps = [
    packet ? "" : "No evidence packet is linked to this selected constraint.",
    triage ? "" : "No validation triage record is linked to this constraint.",
    evidencePack ? "" : "No evidence pack is linked to this constraint.",
    evidencePack && evidencePack.source_records.length > 0
      ? ""
      : "No source records are linked through the evidence pack.",
    comparison ? "" : "No comparison record is available for this constraint.",
    networkEdges.length > 0
      ? ""
      : "No network edges are available for this constraint."
  ].filter(Boolean);

  return {
    rank,
    campaign_constraint: campaignConstraint,
    triage,
    packet,
    evidence_pack: evidencePack,
    comparison,
    network_edges: networkEdges,
    artifact_needs: artifactNeeds,
    required_artifacts: unique([
      ...artifactNeeds.map((artifact) => artifact.artifact_title),
      ...(packet?.artifact_checklist ?? []),
      ...campaignConstraint.required_artifacts,
      triage?.next_best_action.expected_artifact ?? ""
    ]),
    source_upgrades_needed: unique([
      ...(campaignConstraint.source_upgrades_needed ?? []),
      evidencePack?.recommended_source_upgrade ?? ""
    ]),
    success_criteria:
      packet?.pass_criteria ??
      [
        "Artifact directly resolves the selected validation action.",
        "Analyst can name the source, owner, metric, or observation behind the claim.",
        "Residual uncertainty is documented rather than hidden."
      ],
    failure_criteria:
      packet?.fail_criteria ??
      [
        "Artifact cannot be tied to the constraint claim.",
        "Source or metric remains too vague for repeatable validation.",
        "The campaign would still depend on unsupported assumptions."
      ],
    relationship_gaps: relationshipGaps
  };
}

function networkEdgesFor(edges: ConstraintNetworkEdge[], constraintId: string) {
  const nodeId = `constraint:${constraintId}`;

  return edges
    .filter((edge) => edge.source === nodeId || edge.target === nodeId)
    .sort(
      (first, second) =>
        second.strength - first.strength || first.label.localeCompare(second.label)
    )
    .slice(0, 6);
}

function summarizeCampaignDetail(
  campaign: ValidationCampaign,
  constraints: CampaignDetailConstraint[]
): ValidationCampaignDetail["summary"] {
  return {
    selected_constraints: constraints.length,
    unique_industries: unique(
      campaign.selected_constraints.map((constraint) => constraint.industry)
    ).length,
    required_artifacts: unique(
      constraints.flatMap((constraint) => constraint.required_artifacts)
    ).length,
    source_records: unique(
      constraints.flatMap(
        (constraint) =>
          constraint.evidence_pack?.source_records.map((source) => source.source_id) ??
          []
      )
    ).length,
    expected_total_lift:
      campaign.expected_confidence_lift.total_estimated_lift,
    relationship_gap_count: constraints.reduce(
      (total, constraint) => total + constraint.relationship_gaps.length,
      0
    )
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
