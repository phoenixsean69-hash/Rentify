import * as Updates from "expo-updates";
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const config = {
  platform: "com.jsm.restate",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
  propertiesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  galleriesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
};

interface CreateUserParams {
  email: string;
  password: string;
  name: string;
  userMode: string;
}

interface SignInParams {
  email: string;
  password: string;
}

export const client = new Client()
  .setEndpoint(config.endpoint!)
  .setProject(config.projectId!)
  .setPlatform(config.platform!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export async function forceRestart() {
  try {
    await Updates.reloadAsync();
  } catch (error) {
    console.error("Failed to restart app:", error);
  }
}

export const createUser = async ({
  email,
  password,
  name,
  userMode,
}: CreateUserParams) => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const avatarUrl = avatars.getInitialsURL(name);
    return await databases.createDocument(
      config.databaseId!,
      config.usersCollectionId!,
      ID.unique(),
      {
        email,
        name,
        accountId: newAccount.$id,
        avatar: avatarUrl,
        userMode,
      },
    );
  } catch (error: any) {
    console.log("createUser error:", error);
    throw new Error(error?.message || "Failed to create user");
  }
};

export const uploadFile = async (file: any) => {
  try {
    const uploadedFile = await storage.createFile(
      config.bucketId!,
      ID.unique(),
      file,
    );

    const fileUrl = storage.getFileView(config.bucketId!, uploadedFile.$id);

    return {
      id: uploadedFile.$id,
      url: fileUrl,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    await account.createEmailPasswordSession(email, password);
  } catch (error: any) {
    console.log("signIn error:", error);
    throw new Error(error?.message || "Failed to sign in");
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) return null;

    const userDocs = await databases.listDocuments(
      config.databaseId!,
      config.usersCollectionId!,
      [Query.equal("accountId", currentAccount.$id)],
    );

    if (!userDocs.documents.length) return null;

    return userDocs.documents[0];
  } catch (error) {
    console.log("getCurrentUser error:", error);
    return null; // 🚀 IMPORTANT: never throw
  }
};

export async function logout() {
  try {
    let result = await account.deleteSession("current");
    return result;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// Add this function to your appwrite.ts

// Update user's custom avatar
export async function updateUserAvatar(userId: string, avatarId: string) {
  try {
    // Find the user document by accountId
    const userDocs = await databases.listDocuments(
      config.databaseId!,
      config.usersCollectionId!,
      [Query.equal("accountId", userId)],
    );

    if (userDocs.documents.length === 0) {
      throw new Error("User not found");
    }

    const userDoc = userDocs.documents[0];

    // Update the customAvatar field
    const updated = await databases.updateDocument(
      config.databaseId!,
      config.usersCollectionId!,
      userDoc.$id,
      {
        customAvatar: avatarId, // Store the avatar ID (e.g., "human-1", "human-2", etc.)
      },
    );

    return updated;
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
}

// PROPERTIES (unchanged)
export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(5)],
    );

    // Fetch agent details for each property
    const propertiesWithDetails = await Promise.all(
      result.documents.map(async (property) => {
        if (property.agent) {
          try {
            const agent = await databases.getDocument(
              config.databaseId!,
              config.agentsCollectionId!,
              property.agent,
            );
            property.agent = agent;
          } catch (error) {
            console.error("Error fetching agent for property:", error);
          }
        }
        return property;
      }),
    );

    return propertiesWithDetails;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderDesc("$createdAt")];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("type", filter));

    // Fetch more items when there's a search query
    const fetchLimit = query && query.trim() !== "" ? 50 : limit || 10;
    buildQuery.push(Query.limit(fetchLimit));

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery,
    );

    // Fetch agent details
    let propertiesWithDetails = await Promise.all(
      result.documents.map(async (property) => {
        if (property.agent) {
          try {
            const agent = await databases.getDocument(
              config.databaseId!,
              config.agentsCollectionId!,
              property.agent,
            );
            property.agent = agent;
          } catch (error) {
            console.error("Error fetching agent for property:", error);
          }
        }
        return property;
      }),
    );

    // Apply client-side filtering if there's a search query
    if (query && query.trim() !== "") {
      const searchTerm = query.toLowerCase().trim();

      propertiesWithDetails = propertiesWithDetails.filter((property) => {
        // Search in name
        const nameMatch = (property.name || "")
          .toLowerCase()
          .includes(searchTerm);

        // Search in address/location
        const locationMatch = (property.address || "")
          .toLowerCase()
          .includes(searchTerm);

        // Search in facilities (if facilities is an array)
        let facilitiesMatch = false;
        if (property.facilities && Array.isArray(property.facilities)) {
          facilitiesMatch = property.facilities.some((facility: any) => {
            const facilityName =
              typeof facility === "string"
                ? facility.toLowerCase()
                : (facility.name || facility.title || "").toLowerCase();
            return facilityName.includes(searchTerm);
          });
        }

        // Search in description
        const descriptionMatch = (property.description || "")
          .toLowerCase()
          .includes(searchTerm);

        // Search in bedrooms/bathrooms (if searching for numbers)
        const bedroomsMatch = property.bedrooms
          ?.toString()
          .includes(searchTerm);
        const bathroomsMatch = property.bathrooms
          ?.toString()
          .includes(searchTerm);

        return (
          nameMatch ||
          locationMatch ||
          facilitiesMatch ||
          descriptionMatch ||
          bedroomsMatch ||
          bathroomsMatch
        );
      });

      // Apply limit after filtering
      if (limit) {
        propertiesWithDetails = propertiesWithDetails.slice(0, limit);
      }
    }

    return propertiesWithDetails;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// GET PROPERTY BY ID
export async function getPropertyById({ id }: { id: string }) {
  try {
    // First, get the main property
    const property = await databases.getDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      id,
    );

    // Fetch agent details if agent ID exists
    if (property.agent) {
      try {
        const agent = await databases.getDocument(
          config.databaseId!,
          config.agentsCollectionId!,
          property.agent,
        );
        property.agent = agent;
      } catch (error) {
        console.error("Error fetching agent:", error);
        property.agent = null;
      }
    }

    // Fetch gallery images if gallery IDs exist
    if (property.gallery && Array.isArray(property.gallery)) {
      try {
        const galleryPromises = property.gallery.map((galleryId: string) =>
          databases.getDocument(
            config.databaseId!,
            config.galleriesCollectionId!,
            galleryId,
          ),
        );
        property.gallery = await Promise.all(galleryPromises);
      } catch (error) {
        console.error("Error fetching gallery:", error);
        property.gallery = [];
      }
    }

    // Fetch reviews if review IDs exist
    if (property.reviews && Array.isArray(property.reviews)) {
      try {
        const reviewPromises = property.reviews.map((reviewId: string) =>
          databases.getDocument(
            config.databaseId!,
            config.reviewsCollectionId!,
            reviewId,
          ),
        );
        property.reviews = await Promise.all(reviewPromises);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        property.reviews = [];
      }
    }

    return property;
  } catch (error) {
    console.error("Error in getPropertyById:", error);
    return null;
  }
}
