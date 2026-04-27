import { createClient } from "@/lib/supabase/server";
import { CASES } from "@/lib/game/cases";
import { CasesClient } from "./cases-client";

export const dynamic = "force-dynamic";

export default async function CasesPage({ searchParams }: { searchParams: { case?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();

  const initial = searchParams.case ?? "starter";
  return (
    <main className="container py-6 lg:py-10">
      <CasesClient cases={CASES} initialCaseId={initial} initialCoins={Number(profile?.coins ?? 0)} />
    </main>
  );
}
