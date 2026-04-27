// Hand-written types matching supabase/schema.sql.
// You can later replace with `supabase gen types typescript`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ProfilesRow {
  id: string;
  username: string;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  draws: number;
  pity_mythic: number;
  last_daily: string | null;
  created_at: string;
}

interface UserCreaturesRow {
  id: string;
  user_id: string;
  creature_id: string;
  rarity: string;
  level: number;
  xp: number;
  shiny: boolean;
  locked: boolean;
  obtained_at: string;
}

interface MarketListingsRow {
  id: string;
  seller_id: string;
  user_creature_id: string;
  creature_id: string;
  rarity: string;
  level: number;
  price: number;
  status: "open" | "sold" | "cancelled";
  buyer_id: string | null;
  created_at: string;
  closed_at: string | null;
}

interface TradesRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_offer: string[];
  receiver_offer: string[];
  sender_coins: number;
  receiver_coins: number;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  closed_at: string | null;
}

interface BattlesRow {
  id: string;
  p1_id: string;
  p2_id: string | null;
  p1_creature: string;
  p2_creature_id: string | null;
  winner: "p1" | "p2" | "draw";
  rewards_coins: number;
  rewards_xp: number;
  log: Json;
  mode: "pve" | "pvp";
  created_at: string;
}

interface ActivityRow {
  id: string;
  user_id: string;
  type: string;
  payload: Json;
  created_at: string;
}

interface LeaderboardRow {
  id: string;
  username: string;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  coins: number;
  unique_creatures: number;
  total_creatures: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: Partial<ProfilesRow> & { id: string; username: string };
        Update: Partial<ProfilesRow>;
        Relationships: [];
      };
      user_creatures: {
        Row: UserCreaturesRow;
        Insert: Pick<UserCreaturesRow, "user_id" | "creature_id" | "rarity"> & Partial<UserCreaturesRow>;
        Update: Partial<UserCreaturesRow>;
        Relationships: [];
      };
      market_listings: {
        Row: MarketListingsRow;
        Insert: Pick<MarketListingsRow, "seller_id" | "user_creature_id" | "creature_id" | "rarity" | "level" | "price"> & Partial<MarketListingsRow>;
        Update: Partial<MarketListingsRow>;
        Relationships: [];
      };
      trades: {
        Row: TradesRow;
        Insert: Pick<TradesRow, "sender_id" | "receiver_id"> & Partial<TradesRow>;
        Update: Partial<TradesRow>;
        Relationships: [];
      };
      battles: {
        Row: BattlesRow;
        Insert: Pick<BattlesRow, "p1_id" | "p1_creature" | "winner" | "log"> & Partial<BattlesRow>;
        Update: Partial<BattlesRow>;
        Relationships: [];
      };
      activity: {
        Row: ActivityRow;
        Insert: Pick<ActivityRow, "user_id" | "type" | "payload"> & Partial<ActivityRow>;
        Update: Partial<ActivityRow>;
        Relationships: [];
      };
    };
    Views: {
      leaderboard: { Row: LeaderboardRow; Relationships: [] };
    };
    Functions: {
      execute_trade: { Args: { p_trade_id: string }; Returns: void };
      buy_listing: { Args: { p_listing_id: string }; Returns: void };
    };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
}
