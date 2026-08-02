import { AppShell } from "@/components/layout/app-shell";
import { StakeholderCenter } from "@/components/stakeholder/stakeholder-center";

export default function StakeholdersPage() {
  return (
    <AppShell active="Stakeholders">
      <div className="content">
        <StakeholderCenter />
      </div>
    </AppShell>
  );
}
