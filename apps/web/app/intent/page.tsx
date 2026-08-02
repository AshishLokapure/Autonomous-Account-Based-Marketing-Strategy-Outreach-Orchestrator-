import { AppShell } from "@/components/layout/app-shell";
import { IntentCenter } from "@/components/research/intent-center";

export default function IntentPage() {
  return (
    <AppShell active="Intent Signals">
      <div className="content">
        <IntentCenter />
      </div>
    </AppShell>
  );
}
