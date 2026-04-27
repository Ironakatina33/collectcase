"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Layers,
  Swords,
  ShoppingCart,
  ArrowLeftRight,
  Trophy,
  User,
  LogOut,
  Sparkles,
  Coins,
  Gem
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface NavProps {
  username: string;
  coins: number;
  gems: number;
  level: number;
  xp: number;
}

const items = [
  { href: "/play", label: "Tableau de bord", icon: Sparkles },
  { href: "/play/cases", label: "Coffres", icon: Box },
  { href: "/play/collection", label: "Mythadex", icon: Layers },
  { href: "/play/combat", label: "Arène", icon: Swords },
  { href: "/play/market", label: "Marché", icon: ShoppingCart },
  { href: "/play/trade", label: "Échanges", icon: ArrowLeftRight },
  { href: "/play/leaderboard", label: "Classement", icon: Trophy },
  { href: "/play/profile", label: "Profil", icon: User }
];

export function Nav({ username, coins, gems, level, xp }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const xpToNext = level * 100;
  const pct = Math.min(100, (xp % xpToNext) / xpToNext * 100);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-white/10 glass-panel">
      <Link href="/play" className="px-6 py-5 border-b border-white/10 aurora-strip">
        <div className="font-display text-2xl font-bold gradient-text">Mythara</div>
        <div className="text-[11px] text-muted-foreground -mt-0.5">Gardiens des Élements</div>
      </Link>

      <div className="px-4 py-4 border-b border-white/10">
        <div className="text-sm font-semibold">{username}</div>
        <div className="text-xs text-muted-foreground mb-2">Niveau {level}</div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Coins className="h-3.5 w-3.5" /> {formatNumber(coins)}
          </span>
          <span className="inline-flex items-center gap-1 text-cyan-300">
            <Gem className="h-3.5 w-3.5" /> {gems}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1.5">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/play" && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "bg-gradient-to-r from-fuchsia-500/25 via-violet-500/15 to-cyan-500/20 text-foreground border border-fuchsia-400/40 shadow-[0_8px_20px_rgba(168,85,247,0.22)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05] border border-transparent"
              )}
            >
              <Icon className={cn("h-4 w-4", active && "text-fuchsia-300")} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground hover:text-foreground border-t border-white/10 transition-colors"
      >
        <LogOut className="h-4 w-4" /> Déconnexion
      </button>
    </aside>
  );
}

export function MobileNav({ username, coins, gems, level }: Omit<NavProps, "xp">) {
  const pathname = usePathname();
  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/10 glass-panel">
        <Link href="/play" className="font-display text-xl font-bold gradient-text">Mythara</Link>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-amber-300"><Coins className="h-3.5 w-3.5" /> {formatNumber(coins)}</span>
          <span className="inline-flex items-center gap-1 text-cyan-300"><Gem className="h-3.5 w-3.5" /> {gems}</span>
        </div>
      </header>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-panel border-t border-white/10">
        <div className="flex justify-around py-1">
          {items.slice(0, 6).map((it) => {
            const Icon = it.icon;
            const active = pathname === it.href || (it.href !== "/play" && pathname.startsWith(it.href));
            return (
              <Link key={it.href} href={it.href} className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px]",
                active ? "text-fuchsia-300" : "text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
                {it.label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
