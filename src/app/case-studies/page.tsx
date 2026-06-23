import caseStudyExport from "../../../data/exports/case_studies.json";
import { CaseStudyWorkspace } from "@/components/CaseStudyWorkspace";
import type { CaseStudyExport } from "@/lib/caseStudies";

export default function CaseStudiesPage() {
  return <CaseStudyWorkspace exportData={caseStudyExport as CaseStudyExport} />;
}
