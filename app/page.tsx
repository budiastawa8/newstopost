import { AppShell } from "@/components/app-shell";
import { isAuthConfigured } from "@/lib/team-auth";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <AppShell showLogout={isAuthConfigured()} />;
}
