import { AppShell } from "@/components/layout/app-shell";
import { OutreachStudio } from "@/components/outreach/outreach-studio";

export default function OutreachPage() {
  return (
    <AppShell active="Outreach Studio">
      <div className="content">
        <OutreachStudio />
      </div>
    </AppShell>
  );
}
