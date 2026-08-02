import { AppShell } from "@/components/layout/app-shell";
import { StrategyCenter } from "@/components/strategy/strategy-center";

export default function StrategyPage() {
  return (
    <AppShell active="Strategy Center">
      <div className="content">
        <StrategyCenter />
      </div>
    </AppShell>
  );
}
