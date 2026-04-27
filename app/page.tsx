import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Box, Swords, ArrowLeftRight, Trophy, ShoppingCart } from "lucide-react";
import { CREATURES } from "@/lib/game/creatures";
import { CreatureCard } from "@/components/game/creature-card";

const showcase = [
  CREATURES.find((c) => c.id === "ignirok")!,
  CREATURES.find((c) => c.id === "auralis")!,
  CREATURES.find((c) => c.id === "yggdros")!,
  CREATURES.find((c) => c.id === "raitanos")!,
  CREATURES.find((c) => c.id === "noxian")!
];

export default function Landing() {
  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <header className="container flex items-center justify-between py-5">
        <Link href="/" className="font-display text-2xl font-bold gradient-text">Mythara</Link>
        <nav className="flex items-center gap-2">
          <Link href="/login"><Button variant="ghost">Connexion</Button></Link>
          <Link href="/register"><Button variant="default">Commencer</Button></Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="container pt-12 pb-24 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6 text-balance">
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs text-fuchsia-200">
            <Sparkles className="h-3.5 w-3.5" /> Beta gratuite — 100% en ligne
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05]">
            Capture, collectionne et <span className="gradient-text">domine l'arène</span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            <strong className="text-foreground">Mythara</strong> mélange l'âme d'une collection façon
            Pokéclicker, l'adrénaline de l'ouverture de coffres, et un vrai PvP en ligne.
            42 créatures originales à débloquer, un marché ouvert, des échanges et un classement
            mondial t'attendent.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register"><Button size="xl" variant="gold">Créer mon compte</Button></Link>
            <Link href="/login"><Button size="xl" variant="outline">J'ai déjà un compte</Button></Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-xl">
            <Stat n="42" l="Créatures" />
            <Stat n="6" l="Élements" />
            <Stat n="5" l="Raretés" />
            <Stat n="∞" l="Combats" />
          </div>
        </div>

        {/* Card stack visual */}
        <div className="relative h-[420px] flex items-center justify-center">
          <div className="absolute inset-0 -z-10 blur-3xl bg-gradient-to-tr from-fuchsia-500/30 via-purple-600/30 to-amber-400/20 rounded-full" />
          <div className="flex gap-3">
            {showcase.map((c, i) => (
              <div key={c.id} style={{ transform: `translateY(${(i - 2) * -8}px) rotate(${(i - 2) * 4}deg)` }}>
                <CreatureCard creature={c} level={50} size="md" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="container py-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-2">
          Tout est <span className="gradient-text">connecté</span>.
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Un seul jeu, des dizaines de boucles de gameplay qui s'imbriquent.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feat icon={Box} title="Coffres avec drop rates" desc="5 types de coffres allant du Novice au Mythique. Animation gambling, suspense, dopamine." />
          <Feat icon={Sparkles} title="Mythadex" desc="42 créatures originales à débloquer. Chacune avec son lore, ses stats, son artefact mythique." />
          <Feat icon={Swords} title="Arène temps réel" desc="Combats tour-par-tour PvE et PvP. Chart de types, critiques, vitesse, le tout en pixel-perfect." />
          <Feat icon={ShoppingCart} title="Marché ouvert" desc="Liste tes créatures, fixe ton prix, regarde les pièces couler. Market made by players." />
          <Feat icon={ArrowLeftRight} title="Échanges directs" desc="Propose un trade à un dresseur, négocie cartes + pièces, valide en un clic." />
          <Feat icon={Trophy} title="Classement mondial" desc="Trois ladders : Niveau, Victoires PvP, Collection. Affiche ton rang." />
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-amber-400/10 p-10 md:p-16">
          <h3 className="font-display text-3xl md:text-4xl font-bold mb-3">Prêt à capturer ta première ?</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Inscription gratuite, 500 pièces offertes, 5 gemmes, et un coffre du Novice gratuit.
          </p>
          <Link href="/register"><Button size="xl" variant="gold">Lancer l'aventure</Button></Link>
        </div>
      </section>

      <footer className="container py-10 text-center text-sm text-muted-foreground">
        Mythara · Création originale fan-game indépendante. Aucune affiliation avec des marques tierces.
      </footer>
    </main>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center">
      <div className="font-display text-2xl font-bold gradient-text">{n}</div>
      <div className="text-xs text-muted-foreground">{l}</div>
    </div>
  );
}

function Feat({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors">
      <Icon className="h-7 w-7 text-fuchsia-300 mb-3" />
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm text-muted-foreground">{desc}</div>
    </div>
  );
}
