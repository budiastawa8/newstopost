import { HomeClient } from "@/components/home-client";
import { isAuthConfigured } from "@/lib/team-auth";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeClient showLogout={isAuthConfigured()} />;
}
