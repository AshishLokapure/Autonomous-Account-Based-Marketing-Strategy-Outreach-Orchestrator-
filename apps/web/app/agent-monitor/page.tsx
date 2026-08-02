import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AgentFlow } from "@/components/agents/agent-flow";

export default function AgentMonitorPage() {
  return (
    <AppShell active="Agent Monitor">
      <div className="content">
        <Suspense fallback={null}>
          <AgentFlow />
        </Suspense>
      </div>
    </AppShell>
  );
}
