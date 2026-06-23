import reportIndex from "../../../data/exports/reports/report_index.json";
import { ReportIndexWorkspace } from "@/components/ReportIndexWorkspace";
import type { ReportIndex } from "@/components/ReportIndexWorkspace";

export default function ReportsPage() {
  return <ReportIndexWorkspace index={reportIndex as ReportIndex} />;
}
