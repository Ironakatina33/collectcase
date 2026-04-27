"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/play");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("next");
    if (p) setNextPath(p);
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Connexion réussie !");
    router.push(nextPath);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Bon retour, dresseur.</h1>
        <p className="text-sm text-muted-foreground">Connecte-toi pour reprendre ta collection.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            required
            placeholder="toi@mythara.gg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Mot de passe</label>
          <Input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Pas de compte ?{" "}
        <Link href="/register" className="text-fuchsia-300 hover:underline">Inscris-toi</Link>
      </div>
    </div>
  );
}
