import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav, MobileNav } from "@/components/layout/nav";

export const dynamic = "force-dynamic";

export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, coins, gems, xp, level")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-6xl">🪐</div>
          <h2 className="font-display text-2xl font-bold">Initialisation du compte…</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Le profil n'a pas pu être chargé. Vérifie que la migration SQL a bien été exécutée
            dans Supabase (voir <code>supabase/schema.sql</code>).
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Nav
        username={profile.username}
        coins={Number(profile.coins)}
        gems={profile.gems}
        level={profile.level}
        xp={profile.xp}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav
          username={profile.username}
          coins={Number(profile.coins)}
          gems={profile.gems}
          level={profile.level}
        />
        <div className="flex-1 pb-20 lg:pb-0">{children}</div>
      </div>
    </div>
  );
}
