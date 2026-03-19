// store/auth.store.ts
import { account, config, databases } from "@/lib/appwrite";
import { ID, Query } from "react-native-appwrite";
import { create } from "zustand";

const createValidAppwriteId = (): string => {
  let id = ID.unique();
  id = id.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!id) id = "u" + Date.now().toString(36);
  if (!/^[a-zA-Z0-9]/.test(id)) id = "u" + id;
  return id.slice(0, 36);
};

// Define types
interface User {
  $id: string;
  accountId: string;
  name: string;
  userMode: "tenant" | "landlord";
  email: string;
  phone: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  fetchAuthenticatedUser: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    userData: SignUpData,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
}

interface SignUpData {
  name: string;
  userMode: "tenant" | "landlord";
  email: string;
  phone: string;
  password: string;
  avatar?: string;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  fetchAuthenticatedUser: async () => {
    try {
      const currentAccount = await account.get();
      if (currentAccount) {
        const userDetails = await databases.listDocuments(
          config.databaseId!,
          config.usersCollectionId!,
          [Query.equal("accountId", currentAccount.$id)],
        );

        if (userDetails.documents.length > 0) {
          set({
            user: userDetails.documents[0] as unknown as User,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error("Error fetching authenticated user:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      // Use createSession instead of createEmailSession (Appwrite v2+)
      await account.createEmailPasswordSession(email, password);
      const currentAccount = await account.get();

      const userDetails = await databases.listDocuments(
        config.databaseId!,
        config.usersCollectionId!,
        [Query.equal("accountId", currentAccount.$id)],
      );

      if (userDetails.documents.length > 0) {
        set({
          user: userDetails.documents[0] as unknown as User,
          isAuthenticated: true,
        });
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred during sign in",
      };
    }
  },

  signUp: async (userData: SignUpData) => {
    try {
      const accountId = createValidAppwriteId();
      const userDocumentId = createValidAppwriteId();
      const newAccount = await account.create(
        accountId,
        userData.email,
        userData.password,
        userData.name,
      );

      if (newAccount) {
        const userDocument = await databases.createDocument(
          config.databaseId!,
          config.usersCollectionId!,
          userDocumentId,
          {
            accountId: newAccount.$id,
            name: userData.name,
            userMode: userData.userMode,
            email: userData.email,
            avatar: userData.avatar || "",
            phone: userData.phone,
          },
        );

        // Use email/password session for login
        await account.createEmailPasswordSession(
          userData.email,
          userData.password,
        );

        set({
          user: userDocument as unknown as User,
          isAuthenticated: true,
        });

        return { success: true };
      }
      return { success: false, error: "Failed to create account" };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred during sign up",
      };
    }
  },

  signOut: async () => {
    try {
      await account.deleteSession("current");
      set({ user: null, isAuthenticated: false });
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "An error occurred during sign out",
      };
    }
  },
}));

export default useAuthStore;
