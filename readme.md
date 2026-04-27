# Mythara — Web Game Collection / Cases / PvP

Jeu web original inspiré des mécaniques de collection, ouverture de coffres, échanges et combat compétitif.

## Stack

- `Next.js 14` + `TypeScript` + `Tailwind`
- `Supabase` (Auth + Postgres + RLS)
- Déploiement gratuit sur `Vercel`

## Fonctionnalités implémentées

- Système de compte (inscription / connexion)
- Dashboard joueur avec récompense quotidienne
- Ouverture de coffres avec animation type gambling + système de pity
- Collection (Mythadex), filtres, sélection multiple, vente en masse
- Combat PvE + PvP simulé tour par tour avec logs
- Marketplace (mise en vente, achat, annulation)
- Échanges joueur ↔ joueur (proposition, acceptation RPC, refus, annulation)
- Profil joueur + classements

## Lancer en local

```bash
npm install
npm run dev
```

App disponible sur `http://localhost:3000`.

## Configuration Supabase (gratuit)

1. Créer un projet sur `https://supabase.com` (plan free).
2. Dans le SQL Editor, exécuter le contenu de `supabase/schema.sql`.
3. Copier `.env.example` vers `.env.local` puis renseigner :

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

> `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être exposée côté client.

## Déploiement Vercel (gratuit)

1. Push le repo sur GitHub.
2. Créer un projet sur `https://vercel.com`, importer le repo.
3. Ajouter les variables d’environnement (mêmes clés que `.env.local`).
4. Déployer.

À chaque push sur la branche principale, Vercel redéploie automatiquement.

## Notes importantes

- Le thème est **100% original** (univers Mythara), aucune ressource Pokémon.
- Les mécaniques de “case opening” restent dans un cadre jeu fictif sans argent réel.
- Build validé :

```bash
npx --no-install next build
```

## Scripts

- `npm run dev` : développement
- `npm run build` : build production
- `npm run start` : run production local
- `npm run lint` : lint Next.js