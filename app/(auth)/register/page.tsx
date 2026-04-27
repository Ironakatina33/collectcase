"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.length < 3 || username.length > 20) {
      toast.error("Le pseudo doit faire 3 à 20 caractères.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Le pseudo n'autorise que lettres, chiffres et _.");
      return;
    }
    if (password.length < 6) {
      toast.error("Mot de passe trop court (minimum 6 caractères).");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/play` : undefined
      }
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé ! Bienvenue dans Mythara.");
    router.push("/play");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Crée ton compte</h1>
        <p className="text-sm text-muted-foreground">
          500 pièces · 5 gemmes · un coffre du Novice gratuit t'attendent.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Pseudo</label>
          <Input
            required
            minLength={3}
            maxLength={20}
            placeholder="ton_pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
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
            minLength={6}
            placeholder="6 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" variant="gold" className="w-full" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-fuchsia-300 hover:underline">Se connecter</Link>
      </div>
    </div>
  );
}
