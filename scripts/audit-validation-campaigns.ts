type CampaignAuditFsModule = typeof import("node:fs");
type CampaignAuditPathModule = typeof import("node:path");

const { readFileSync: campaignAuditReadFileSync } = process.getBuiltinModule(
  "fs"
) as CampaignAuditFsModule;
const { resolve: campaignAuditResolve } = process.getBuiltinModule(
  "path"
) as CampaignAuditPathModule;

const campaignAuditPath = campaignAuditResolve(
  "data/exports/validation_campaigns.json"
);

type CampaignAuditConstraint = {
  constraint_id: string;
  constraint_title: string;
  expected_confidence_lift: number;
  required_artifacts: string[];
  source_upgrades_needed: string[];
  investigation_route: string;
  validation_route: string;
  source_route: string;
  comparison_route: string;
  network_route: string;
};

type CampaignAuditCampaign = {
  campaign_id: string;
  mode: string;
  title: string;
  selected_constraints: CampaignAuditConstraint[];
  expected_confidence_lift: {
    total_estimated_lift: number;
    average_estimated_lift: number;
  };
};

const campaignAuditExport = JSON.parse(
  campaignAuditReadFileSync(campaignAuditPath, "utf8")
) as {
  summary: {
    campaign_count: number;
    total_selected_constraints: number;
    unique_constraint_coverage: number;
    average_expected_confidence_lift: number;
    mode_distribution: Record<string, number>;
  };
  campaigns: CampaignAuditCampaign[];
};

const campaignAuditFailures: string[] = [];
const campaignAuditAllSelected = campaignAuditExport.campaigns.flatMap(
  (campaign) => campaign.selected_constraints
);
const campaignAuditBrokenLinks = campaignAuditAllSelected.filter(
  (constraint) =>
    !constraint.investigation_route.startsWith("/constraints/") ||
    !constraint.validation_route.startsWith("/validation") ||
    constraint.source_route !== "/sources" ||
    !constraint.comparison_route.startsWith("/compare?ids=") ||
    !constraint.network_route.startsWith("/network?focus=")
);
const campaignAuditMissingArtifacts = campaignAuditAllSelected.filter(
  (constraint) =>
    constraint.required_artifacts.length === 0 ||
    constraint.source_upgrades_needed.length === 0 ||
    constraint.expected_confidence_lift <= 0
);

console.log("Validation campaign audit");
console.log(`- campaign count: ${campaignAuditExport.summary.campaign_count}`);
console.log(
  `- selected constraints: ${campaignAuditExport.summary.total_selected_constraints}`
);
console.log(
  `- unique constraint coverage: ${campaignAuditExport.summary.unique_constraint_coverage}`
);
console.log(
  `- average expected confidence lift: ${campaignAuditExport.summary.average_expected_confidence_lift}`
);
console.log(
  `- mode distribution: ${campaignAuditFormatDistribution(
    campaignAuditExport.summary.mode_distribution
  )}`
);
console.log("- campaign plans:");
campaignAuditExport.campaigns.forEach((campaign) => {
  console.log(
    `  - ${campaign.title}: ${campaign.selected_constraints.length} constraints, +${campaign.expected_confidence_lift.total_estimated_lift} total lift`
  );
});

if (campaignAuditExport.summary.campaign_count !== 3) {
  campaignAuditFailures.push("expected exactly 3 campaign modes");
}
["fast", "standard", "deep"].forEach((mode) => {
  if (!campaignAuditExport.summary.mode_distribution[mode]) {
    campaignAuditFailures.push(`missing ${mode} campaign`);
  }
});
if (campaignAuditExport.summary.unique_constraint_coverage < 10) {
  campaignAuditFailures.push("expected at least 10 unique covered constraints");
}
if (campaignAuditMissingArtifacts.length > 0) {
  campaignAuditFailures.push(
    `${campaignAuditMissingArtifacts.length} selected constraints are missing artifacts, source upgrades, or confidence lift`
  );
}
if (campaignAuditBrokenLinks.length > 0) {
  campaignAuditFailures.push(
    `${campaignAuditBrokenLinks.length} selected constraints have broken internal route shapes`
  );
}
if (
  campaignAuditExport.campaigns.some(
    (campaign) =>
      campaign.expected_confidence_lift.total_estimated_lift <= 0 ||
      campaign.expected_confidence_lift.average_estimated_lift <= 0
  )
) {
  campaignAuditFailures.push("one or more campaigns has invalid lift logic");
}

if (campaignAuditFailures.length > 0) {
  console.error("- campaign audit failures:");
  campaignAuditFailures.forEach((failure) => console.error(`  - ${failure}`));
  process.exitCode = 1;
} else {
  console.log("- result: PASS");
}

function campaignAuditFormatDistribution(values: Record<string, number>) {
  return Object.entries(values)
    .map(([label, count]) => `${label} (${count})`)
    .join(", ");
}
