// utils/avatarStorage.ts
import { account } from "../lib/appwrite"; // your Appwrite client

export const saveSelectedAvatar = async (
  avatarId: string,
): Promise<boolean> => {
  try {
    await account.updatePrefs({ avatarId });
    return true;
  } catch (error) {
    console.error("Failed to save avatar:", error);
    return false;
  }
};

export const getSavedAvatar = async (): Promise<string | null> => {
  try {
    const prefs = await account.getPrefs();
    return prefs.avatarId || null;
  } catch (error) {
    console.error("Failed to get avatar:", error);
    return null;
  }
};

export const clearSavedAvatar = async (): Promise<boolean> => {
  try {
    await account.updatePrefs({ avatarId: null });
    return true;
  } catch (error) {
    console.error("Failed to clear avatar:", error);
    return false;
  }
};
