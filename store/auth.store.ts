import { getCurrentUser } from "@/lib/appwrite";
import { create } from "zustand";

interface User {
  $id: string;
  name: string;
  email: string;
  userMode: "landlord" | "tenant";
}
type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;

  fetchAuthenticatedUser: () => Promise<void>;
};

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,

  setIsAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),
  setLoading: (value) => set({ isLoading: value }),

  fetchAuthenticatedUser: async () => {
    set({ isLoading: true });

    try {
      const userDoc = await getCurrentUser();

      if (userDoc) {
        const mappedUser: User = {
          $id: userDoc.$id,
          name: userDoc.name, // make sure these exist in your Appwrite schema
          email: userDoc.email,
          userMode: userDoc.userMode, // or userDoc.prefs?.userMode if stored in prefs
        };

        set({ isAuthenticated: true, user: mappedUser });
      } else {
        set({ isAuthenticated: false, user: null });
      }
    } catch (e) {
      console.log("fetchAuthenticatedUser error", e);
      set({ isAuthenticated: false, user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
