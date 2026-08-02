import { AppShell } from "@/components/layout/app-shell";
import { ResearchCenter } from "@/components/research/research-center";

export default function ResearchPage() {
  return (
    <AppShell active="Research Center">
      <div className="content">
        <ResearchCenter />
      </div>
    </AppShell>
  );
}
