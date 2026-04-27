import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-fuchsia-900/40 via-violet-900/30 to-amber-900/20 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl" />
        <Link href="/" className="relative z-10 font-display text-3xl font-bold gradient-text">Mythara</Link>
        <div className="relative z-10 max-w-md space-y-3">
          <div className="text-7xl animate-float">🌌</div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Le monde de Mythara t'attend.
          </h1>
          <p className="text-muted-foreground">
            Crée ton compte, ouvre ton premier coffre, et défie les autres dresseurs.
          </p>
        </div>
        <div className="relative z-10 text-xs text-muted-foreground">© Mythara — Beta</div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  );
}
