import { AppShell } from "@/components/layout/app-shell";
import { SettingsModule } from "@/components/settings/settings-module";

export default function SettingsPage() {
  return (
    <AppShell active="Settings">
      <SettingsModule />
    </AppShell>
  );
}
