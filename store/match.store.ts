// store/match.store.ts
import { getMatchProfiles, getUserMatchProfile } from "@/lib/appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface MatchStore {
  matchCount: number;
  setMatchCount: (count: number) => void;
  markMatchesAsViewed: () => Promise<void>;
  fetchMatchCount: (userId: string) => Promise<void>;
  getRemainingTime: () => Promise<number>;
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  matchCount: 0,

  setMatchCount: (count) => set({ matchCount: count }),

  markMatchesAsViewed: async () => {
    const hideUntil = Date.now() + 1 * 60 * 1000; // 1 minute from now
    await AsyncStorage.setItem("match_badge_hide_until", hideUntil.toString());
    set({ matchCount: 0 });
  },

  getRemainingTime: async () => {
    const hideUntil = await AsyncStorage.getItem("match_badge_hide_until");
    if (!hideUntil) return 0;

    const remaining = parseInt(hideUntil) - Date.now();
    return remaining > 0 ? remaining : 0;
  },

  fetchMatchCount: async (userId: string) => {
    try {
      // Check if badge is hidden
      const hideUntil = await AsyncStorage.getItem("match_badge_hide_until");
      if (hideUntil && Date.now() < parseInt(hideUntil)) {
        set({ matchCount: 0 });
        return;
      }

      const myProfile = await getUserMatchProfile(userId);
      if (myProfile?.preferredLocation) {
        const matches = await getMatchProfiles({
          location: myProfile.preferredLocation,
        });
        const filteredMatches = matches.filter((m: any) => m.userId !== userId);
        set({ matchCount: filteredMatches.length });
      } else {
        set({ matchCount: 0 });
      }
    } catch (error) {
      console.error("Error fetching match count:", error);
      set({ matchCount: 0 });
    }
  },
}));
