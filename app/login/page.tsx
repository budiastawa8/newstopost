import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const params = await searchParams;
  const setupMissing = params.setup === "1";

  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center p-8 text-sm text-zinc-500">
          Memuat…
        </div>
      }
    >
      <LoginForm setupMissing={setupMissing} />
    </Suspense>
  );
}
