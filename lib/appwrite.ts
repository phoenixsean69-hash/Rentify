import * as ImageManipulator from "expo-image-manipulator";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";
import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  OAuthProvider,
  Query,
  Storage,
} from "react-native-appwrite";

const createValidAppwriteId = (): string => {
  let id = ID.unique();
  id = id.replace(/[^a-zA-Z0-9\-_]/g, "");
  if (!id) id = "u" + Date.now().toString(36);
  if (!/^[a-zA-Z0-9]/.test(id)) id = "u" + id;
  return id.slice(0, 36);
};

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
  favoritesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID,
  likesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_LIKES_COLLECTION,
  activitiesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_ACTIVITIES_COLLECTION,
};

interface CreateUserParams {
  email: string;
  password: string;
  phone: string;
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

// ---------------- USER ----------------

export const createUser = async ({
  email,
  password,
  name,
  phone,
  userMode,
}: CreateUserParams) => {
  try {
    const accountId = createValidAppwriteId();
    const userDocumentId = createValidAppwriteId();
    console.log("createUser: generated accountId", accountId);
    const newAccount = await account.create(accountId, email, password, name);
    if (!newAccount) throw new Error("Failed to create account");

    await signIn({ email, password });

    const avatarUrl = avatars.getInitialsURL(name);
    return await databases.createDocument(
      config.databaseId!,
      config.usersCollectionId!,
      userDocumentId,
      {
        email,
        name,
        accountId: newAccount.$id,
        phone,
        avatar: avatarUrl,
        userMode,
      },
    );
  } catch (error: any) {
    console.log("createUser error:", error);
    throw new Error(error?.message || "Failed to create user");
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
    return await account.createEmailPasswordSession(email, password);
  } catch (error: any) {
    console.log("signIn error:", error);
    throw new Error(error?.message || "Failed to sign in");
  }
};

const BUCKET_ID = config.bucketId!; // create a bucket in Appwrite console

export async function uploadImage(image: any) {
  try {
    // Compress image first
    const compressedImage = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: 1200 } }], // Resize to max width 1200px
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );

    const fileName = image.fileName || `image-${Date.now()}.jpg`;
    const fileType = image.mimeType || "image/jpeg";

    // Get compressed file size
    const fileInfo = await fetch(compressedImage.uri);
    const blob = await fileInfo.blob();
    const fileSize = blob.size;

    console.log("Original size:", image.fileSize);
    console.log("Compressed size:", fileSize);

    // Upload compressed image
    const fileToUpload = {
      uri: compressedImage.uri,
      name: fileName,
      type: fileType,
      size: fileSize,
    };

    const file = await storage.createFile(
      config.bucketId!,
      ID.unique(),
      fileToUpload,
    );

    const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${config.bucketId}/files/${file.$id}/view?project=${config.projectId}`;
    console.log("Upload successful, URL:", imageUrl);

    return imageUrl;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
}

export async function AddListing(listing: {
  propertyName?: string;
  type: string;
  description: string;
  address: string;
  price: number;
  area: number;
  curfew: string;
  isAvailable: boolean;
  roomFor: number;
  bedrooms: number;
  bathrooms: number;
  facilities: string;
  image1?: string;
  image2?: string;
  image3?: string;
  agent?: string; // This should be the user's $id (document ID)
  creatorId?: string;
}) {
  try {
    console.log("Creating listing with agent (user $id):", listing.agent);

    const response = await databases.createDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      ID.unique(),
      {
        propertyName: listing.propertyName,
        type: listing.type,
        description: listing.description,
        address: listing.address,
        price: listing.price,
        area: listing.area,
        roomFor: listing.roomFor,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        facilities: listing.facilities,
        curfew: listing.curfew,
        isAvailable: listing.isAvailable ?? true, // Default to true
        image1: listing.image1 || null,
        image2: listing.image2 || null,
        image3: listing.image3 || null,

        // This should match a document ID in the Users table
        agent: listing.agent || null,
        creatorId: listing.creatorId || null,
      },
    );

    console.log("✅ Listing created:", {
      id: response.$id,
      agent: response.agent, // Should now be the user's $id
    });

    return response;
  } catch (error) {
    console.error("❌ Error adding listing:", error);
    throw error;
  }
}

export const uploadFile = async (file: any) => {
  try {
    const uploadedFile = await storage.createFile(
      config.bucketId!,
      ID.unique(),
      file,
    );
    const fileUrl = storage.getFileView(config.bucketId!, uploadedFile.$id);
    return { id: uploadedFile.$id, url: fileUrl };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
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
    return null;
  }
};

// ---------------- OAUTH ----------------

export async function loginWithGoogle(userMode?: "tenant" | "landlord") {
  try {
    const redirectUri = Linking.createURL("/");
    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri,
    );
    if (!response) throw new Error("OAuth failed");

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri,
    );
    if (browserResult.type !== "success") throw new Error("OAuth failed");

    const url = new URL(browserResult.url);
    const secret = url.searchParams.get("secret");
    const userId = url.searchParams.get("userId");
    if (!secret || !userId) throw new Error("OAuth failed");

    const validUserId = userId.replace(/[^a-zA-Z0-9._-]/g, "");
    if (validUserId.length === 0 || validUserId.length > 36) {
      throw new Error("OAuth user ID invalid");
    }

    const session = await account.createSession(validUserId, secret);
    if (!session) throw new Error("Session failed");

    const user = await account.get();
    const existingUsers = await databases.listDocuments(
      config.databaseId!,
      config.usersCollectionId!,
      [Query.equal("accountId", user.$id)],
    );

    if (existingUsers.total === 0) {
      const avatarUrl = avatars.getInitialsURL(user.name);
      await databases.createDocument(
        config.databaseId!,
        config.usersCollectionId!,
        ID.unique(),
        {
          email: user.email,
          name: user.name,
          accountId: user.$id,
          avatar: avatarUrl,
          userMode: userMode || "tenant",
        },
      );
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// ---------------- FAVORITES ----------------

export const addFavorite = async (userId: string, propertyId: string) => {
  return await databases.createDocument(
    config.databaseId!,
    config.favoritesCollectionId!,
    ID.unique(),
    {
      userId,
      propertyId: [propertyId],
    },
  );
};

export const getFavoritesByUser = async (favoriteDocumentId: string) => {
  try {
    const favorite = await databases.getDocument(
      config.databaseId!,
      config.favoritesCollectionId!,
      favoriteDocumentId,
      [
        Query.select([
          "$id",
          "userId",
          "propertyId",
          "propertyId.propertyName",
          "propertyId.propertyLocation",
        ]),
      ],
    );
    return favorite;
  } catch (error) {
    console.error("Error fetching favorite with property:", error);
    throw error;
  }
};

export async function logout() {
  try {
    return await account.deleteSession("current");
  } catch (error) {
    console.error(error);
    return false;
  }
}

// ---------------- AVATAR ----------------

export async function updateUserAvatar(userId: string, avatarId: string) {
  try {
    const userDocs = await databases.listDocuments(
      config.databaseId!,
      config.usersCollectionId!,
      [Query.equal("accountId", userId)],
    );
    if (userDocs.documents.length === 0) throw new Error("User not found");

    const userDoc = userDocs.documents[0];
    return await databases.updateDocument(
      config.databaseId!,
      config.usersCollectionId!,
      userDoc.$id,
      { customAvatar: avatarId },
    );
  } catch (error) {
    console.error("Error updating avatar:", error);
    throw error;
  }
}

// ---------------- PROPERTIES ----------------

// Helper: fetch reviews for a property
export const getReviewsByProperty = async (propertyId: string) => {
  const res = await databases.listDocuments(
    config.databaseId!,
    config.reviewsCollectionId!,
    [Query.equal("property", propertyId)],
  );
  return res.documents;
};

// Toggle review (add/remove)
// Toggle review (add/remove) - ADAPTED FOR YOUR SCHEMA
// lib/appwrite.ts

export const addReview = async (
  propertyId: string,
  reviewText: string,
  rating: number,
) => {
  try {
    const currentUser = await account.get();

    const newReview = {
      id: Date.now().toString(),
      userName: currentUser.name,
      userAvatar: currentUser.prefs?.avatar || null,
      review: reviewText,
      rating: rating,
      date: new Date().toISOString(),
    };

    // Get current property
    const property = await databases.getDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      propertyId,
    );

    // Update reviews
    let currentReviews = [];
    if (property.reviews) {
      try {
        currentReviews = JSON.parse(property.reviews);
      } catch (e) {
        currentReviews = [];
      }
    }

    const updatedReviews = [...currentReviews, newReview];
    await databases.updateDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      propertyId,
      { reviews: JSON.stringify(updatedReviews) },
    );

    // Track review activity
    await trackReviewActivity(propertyId, newReview.id);

    return newReview;
  } catch (error) {
    console.error("❌ Error adding review:", error);
    throw error;
  }
};

// Helper function to calculate average rating

// Get review count for a property
export async function getReviewCount(propertyId: string) {
  try {
    const reviews = await databases.listDocuments(
      config.databaseId!,
      config.reviewsCollectionId!,
      [Query.equal("propertyId", propertyId)],
    );

    return reviews.total;
  } catch (error) {
    console.error("Error getting review count:", error);
    return 0;
  }
}

// Check if user has reviewed a property
export async function checkUserReviewed(propertyId: string, userId: string) {
  try {
    const reviews = await databases.listDocuments(
      config.databaseId!,
      config.reviewsCollectionId!,
      [Query.equal("propertyId", propertyId), Query.equal("userId", userId)],
    );

    return reviews.documents.length > 0;
  } catch (error) {
    console.error("Error checking review:", error);
    return false;
  }
}

// Get user's review for a property
export async function getUserReview(propertyId: string, userId: string) {
  try {
    const reviews = await databases.listDocuments(
      config.databaseId!,
      config.reviewsCollectionId!,
      [Query.equal("propertyId", propertyId), Query.equal("userId", userId)],
    );

    return reviews.documents[0] || null;
  } catch (error) {
    console.error("Error getting user review:", error);
    return null;
  }
}

export async function deleteProperty(propertyId: string) {
  try {
    await databases.deleteDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      propertyId,
    );
    return { success: true };
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
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
    const fetchLimit = query && query.trim() !== "" ? 50 : limit || 10;
    buildQuery.push(Query.limit(fetchLimit));

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery,
    );

    let propertiesWithDetails = await Promise.all(
      result.documents.map(async (property) => {
        // Agent - Fetch from USERS collection
        if (property.agent) {
          try {
            const agent = await databases.getDocument(
              config.databaseId!,
              config.usersCollectionId!,
              property.agent,
            );
            property.agent = agent;
          } catch (error) {
            console.error("Error fetching agent from users:", error);
            property.agent = null;
          }
        }

        // Reviews → calculate average rating from JSON string
        if (property.reviews) {
          try {
            const parsedReviews = JSON.parse(property.reviews);
            if (parsedReviews.length > 0) {
              const sum = parsedReviews.reduce(
                (acc: number, r: any) => acc + (r.rating || 0),
                0,
              );
              property.rating = Number((sum / parsedReviews.length).toFixed(1));
            } else {
              property.rating = 0;
            }
          } catch (e) {
            console.error("Error parsing reviews:", e);
            property.rating = 0;
          }
        } else {
          property.rating = 0;
        }

        // Resolve image file IDs into preview URLs
        if (property.images && Array.isArray(property.images)) {
          property.images = property.images.map((fileId: string) =>
            storage.getFilePreview(config.bucketId!, fileId),
          );
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

export async function getPropertiesByCreator(
  creatorId: string,
  limit: number = 10,
  latest: boolean = false,
  filter?: string,
  query?: string,
) {
  try {
    const queries = [Query.equal("creatorId", creatorId)];

    if (filter && filter !== "All") {
      queries.push(Query.equal("type", filter));
    }

    if (query && query.trim() !== "") {
      queries.push(Query.search("propertyName", query));
    }

    if (latest) {
      queries.push(Query.orderDesc("$createdAt"));
    }

    queries.push(Query.limit(limit));

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      queries,
    );

    // Process the results
    let propertiesWithDetails = await Promise.all(
      result.documents.map(async (property) => {
        // Calculate rating from reviews JSON
        if (property.reviews) {
          try {
            const parsedReviews = JSON.parse(property.reviews);
            if (parsedReviews.length > 0) {
              const sum = parsedReviews.reduce(
                (acc: number, r: any) => acc + (r.rating || 0),
                0,
              );
              property.rating = Number((sum / parsedReviews.length).toFixed(1));
            } else {
              property.rating = 0;
            }
          } catch (e) {
            property.rating = 0;
          }
        } else {
          property.rating = 0;
        }

        return property;
      }),
    );

    return propertiesWithDetails;
  } catch (error) {
    console.error("Error getting properties by creator:", error);
    return [];
  }
}

// Get all liked properties for a user
export async function getUserLikedProperties(userId: string) {
  try {
    // Get all like records for this user
    const likes = await databases.listDocuments(
      config.databaseId!,
      config.likesCollectionId!,
      [Query.equal("userId", userId)],
    );

    // Get the actual property details
    const propertyPromises = likes.documents.map(async (like) => {
      const property = await databases.getDocument(
        config.databaseId!,
        config.propertiesCollectionId!,
        like.propertyId,
      );
      return property;
    });

    return await Promise.all(propertyPromises);
  } catch (error) {
    console.error("Error getting user liked properties:", error);
    return [];
  }
}

// ---------------- PROPERTY BY ID ----------------

// In your appwrite.ts
// ---------------- PROPERTY BY ID ----------------
export async function getPropertyById({ id }: { id: string }) {
  try {
    const property = await databases.getDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      id,
    );

    console.log("📦 Raw property from DB:", {
      id: property.$id,
      reviewsField: property.reviews,
      reviewsType: typeof property.reviews,
    });

    // Fetch agent details
    if (property.agent && typeof property.agent === "string") {
      try {
        const agent = await databases.getDocument(
          config.databaseId!,
          config.usersCollectionId!,
          property.agent,
        );

        property.agent = {
          $id: agent.$id,
          name: agent.name || "Unknown",
          email: agent.email || "No email",
          phone: agent.phone,
          avatar: agent.avatar || null,
        };
      } catch (agentError) {
        console.error("❌ Failed to fetch agent:", agentError);
        property.agent = null;
      }
    }

    // Calculate rating from the reviews JSON string (NOT from separate collection)
    if (property.reviews) {
      try {
        // Parse the JSON string to get the reviews array
        const parsedReviews = JSON.parse(property.reviews);
        console.log("✅ Parsed reviews from property:", parsedReviews.length);

        // Calculate rating from the parsed reviews
        if (parsedReviews.length > 0) {
          const sum = parsedReviews.reduce(
            (acc: number, r: any) => acc + (r.rating || 0),
            0,
          );
          property.rating = Number((sum / parsedReviews.length).toFixed(1));
        } else {
          property.rating = 0;
        }
      } catch (e) {
        console.error("Error parsing reviews for rating:", e);
        property.rating = 0;
      }
    } else {
      property.rating = 0;
    }

    return property;
  } catch (error) {
    console.error("❌ Error in getPropertyById:", error);
    return null;
  }
}

// Count how many times a property appears in Favorites
export async function getLikesCount(propertyId: string) {
  const res = await databases.listDocuments(
    config.databaseId!,
    config.favoritesCollectionId!,
    [Query.equal("propertyId", propertyId)],
  );
  return res.total;
}

export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderDesc("$createdAt"), Query.limit(5)],
    );

    const propertiesWithDetails = await Promise.all(
      result.documents.map(async (property) => {
        // Agent (Many to one relationship)
        if (property.agent) {
          try {
            const agent = await databases.getDocument(
              config.databaseId!,
              config.usersCollectionId!, // ✅ Use usersCollectionId, not agentsCollectionId
              property.agent,
            );
            property.agent = agent;
          } catch (error) {
            console.error("Error fetching agent:", error);
          }
        }

        // ✅ Calculate rating from the reviews JSON string
        if (property.reviews) {
          try {
            const parsedReviews = JSON.parse(property.reviews);
            if (parsedReviews.length > 0) {
              const sum = parsedReviews.reduce(
                (acc: number, r: any) => acc + (r.rating || 0),
                0,
              );
              property.rating = Number((sum / parsedReviews.length).toFixed(1));
            } else {
              property.rating = 0;
            }
          } catch (e) {
            console.error("Error parsing reviews:", e);
            property.rating = 0;
          }
        } else {
          property.rating = 0;
        }

        // Resolve image file IDs to preview URLs for individual image fields
        if (property.images && Array.isArray(property.images)) {
          const imageUrls = property.images.map((fileId: string) =>
            storage.getFilePreview(config.bucketId!, fileId),
          );

          property.image1 = imageUrls[0] || null;
          property.image2 = imageUrls[1] || null;
          property.image3 = imageUrls[2] || null;

          delete property.images;
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

// Toggle like (like/unlike)

export async function toggleLike(propertyId: string, userId: string) {
  try {
    console.log("🔄 Toggling like:", { propertyId, userId });

    // Check if like already exists
    const existingLikes = await databases.listDocuments(
      config.databaseId!,
      config.likesCollectionId!,
      [Query.equal("propertyId", propertyId), Query.equal("userId", userId)],
    );

    if (existingLikes.documents.length > 0) {
      // Unlike - delete the like record
      await databases.deleteDocument(
        config.databaseId!,
        config.likesCollectionId!,
        existingLikes.documents[0].$id,
      );

      // Decrement likes count
      const property = await databases.getDocument(
        config.databaseId!,
        config.propertiesCollectionId!,
        propertyId,
      );

      const newLikeCount = Math.max(0, (property.likes || 0) - 1);

      await databases.updateDocument(
        config.databaseId!,
        config.propertiesCollectionId!,
        propertyId,
        { likes: newLikeCount },
      );

      // Track unlike activity
      await trackLikeActivity(propertyId, userId, "unliked");

      return { liked: false, likeCount: newLikeCount };
    } else {
      // Like - create new like record
      await databases.createDocument(
        config.databaseId!,
        config.likesCollectionId!,
        ID.unique(),
        { propertyId, userId },
      );

      // Increment likes count
      const property = await databases.getDocument(
        config.databaseId!,
        config.propertiesCollectionId!,
        propertyId,
      );

      const newLikeCount = (property.likes || 0) + 1;

      await databases.updateDocument(
        config.databaseId!,
        config.propertiesCollectionId!,
        propertyId,
        { likes: newLikeCount },
      );

      // Track like activity
      await trackLikeActivity(propertyId, userId, "liked");

      return { liked: true, likeCount: newLikeCount };
    }
  } catch (error) {
    console.error("❌ Error toggling like:", error);
    throw error;
  }
}

// Get like count for a property
export async function getLikeCount(propertyId: string) {
  try {
    const property = await databases.getDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      propertyId,
    );

    return property.likes || 0;
  } catch (error) {
    console.error("Error getting like count:", error);
    return 0;
  }
}

// Check if user liked a property
export async function checkUserLiked(propertyId: string, userId: string) {
  try {
    const likes = await databases.listDocuments(
      config.databaseId!,
      config.likesCollectionId!,
      [Query.equal("propertyId", propertyId), Query.equal("userId", userId)],
    );

    return likes.documents.length > 0;
  } catch (error) {
    console.error("Error checking like:", error);
    return false;
  }
}

// Get top liked properties for a creator (for "My top Listings")
export async function getTopLikedProperties(
  creatorId: string,
  limit: number = 5,
) {
  try {
    // First get all properties by this creator
    const properties = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.equal("creatorId", creatorId)],
    );

    // For each property, get like count
    const propertiesWithLikes = await Promise.all(
      properties.documents.map(async (property) => {
        const likeCount = await getLikeCount(property.$id);
        return {
          ...property,
          likeCount,
        };
      }),
    );

    // Sort by likeCount descending and take top 'limit'
    const sorted = propertiesWithLikes
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, limit);

    return propertiesWithLikes;
  } catch (error) {
    console.error("Error getting top liked properties:", error);
    return [];
  }
}

// Get properties sorted by likes (for My Top Listings)
export async function getTopListingsByLikes(
  creatorId: string,
  limit: number = 5,
) {
  try {
    // First get all properties by this creator
    const properties = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.equal("creatorId", creatorId)],
    );

    // For each property, get like count
    const propertiesWithLikes = await Promise.all(
      properties.documents.map(async (property) => {
        const likeCount = await getLikeCount(property.$id);
        return {
          ...property,
          likeCount,
        };
      }),
    );

    // Sort by likeCount descending and take top 'limit'
    const sorted = propertiesWithLikes
      .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
      .slice(0, limit);

    // Add ratings
    const propertiesWithDetails = await Promise.all(
      sorted.map(async (property: any) => {
        // Add ': any' temporarily
        try {
          const reviews = await getReviewsByProperty(property.$id);
          property.rating =
            reviews.length > 0
              ? Number(
                  (
                    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                    reviews.length
                  ).toFixed(1),
                )
              : 0;
        } catch {
          property.rating = 0;
        }
        return property;
      }),
    );

    return propertiesWithDetails;
  } catch (error) {
    console.error("Error getting top listings by likes:", error);
    return [];
  }
}

// Get like count for multiple properties at once (efficient)
export async function getLikeCountsForProperties(propertyIds: string[]) {
  try {
    const likeCounts: Record<string, number> = {};

    // Get all likes for these properties
    const likes = await databases.listDocuments(
      config.databaseId!,
      config.likesCollectionId!,
      [Query.equal("propertyId", propertyIds)],
    );

    // Count likes per property
    likes.documents.forEach((like) => {
      const propId = like.propertyId;
      likeCounts[propId] = (likeCounts[propId] || 0) + 1;
    });

    return likeCounts;
  } catch (error) {
    console.error("Error getting like counts:", error);
    return {};
  }
}

export async function getAgent(agentId: string) {
  try {
    if (!agentId) {
      console.log("No agent ID provided");
      return null;
    }

    console.log("🔍 Fetching agent with ID:", agentId);

    // Fetch the user document from Users table
    const agent = await databases.getDocument(
      config.databaseId!,
      config.usersCollectionId!, // Your Users table ID
      agentId,
    );

    console.log("✅ Agent fetched successfully:", {
      id: agent.$id,
      name: agent.name,
      email: agent.email,
    });

    // Return the user data (this will contain name, email, avatar, etc.)
    return {
      $id: agent.$id,
      name: agent.name || "Unknown",
      email: agent.email || "No email",
      avatar: agent.avatar || null,
      // Include any other user fields you need
    };
  } catch (error) {
    console.error("❌ Error fetching agent:", error);
    return null;
  }
}

// In your appwrite.ts, add these functions

// Track a property view
export async function trackPropertyView(propertyId: string) {
  try {
    const activity = await databases.createDocument(
      config.databaseId!,
      config.activitiesCollectionId!,
      ID.unique(),
      {
        propertyId,
        type: "view",
        message: "Property was viewed",
        count: 1,
        createdAt: new Date().toISOString(),
      },
    );
    return activity;
  } catch (error) {
    console.error("Error tracking view:", error);
  }
}

// Track a like (call this in your toggleLike function)
export async function trackLikeActivity(
  propertyId: string,
  userId: string,
  action: "liked" | "unliked",
) {
  try {
    const activity = await databases.createDocument(
      config.databaseId!,
      config.activitiesCollectionId!,
      ID.unique(),
      {
        propertyId,
        type: "like",
        message:
          action === "liked"
            ? "Someone liked your property"
            : "Someone unliked your property",
        count: 1,
        createdAt: new Date().toISOString(),
      },
    );
    return activity;
  } catch (error) {
    console.error("Error tracking like activity:", error);
  }
}

// Track a review
export async function trackReviewActivity(
  propertyId: string,
  reviewId: string,
) {
  try {
    const activity = await databases.createDocument(
      config.databaseId!,
      config.activitiesCollectionId!,
      ID.unique(),
      {
        propertyId,
        type: "review",
        message: "New review received",
        count: 1,
        createdAt: new Date().toISOString(),
      },
    );
    return activity;
  } catch (error) {
    console.error("Error tracking review:", error);
  }
}

// Get recent activities for a landlord
export async function getRecentActivities(
  landlordId: string,
  limit: number = 10,
) {
  try {
    // First get all properties for this landlord
    const properties = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.equal("creatorId", landlordId)],
    );

    const propertyIds = properties.documents.map((p) => p.$id);

    if (propertyIds.length === 0) return [];

    // Get activities for these properties
    const activities = await databases.listDocuments(
      config.databaseId!,
      config.activitiesCollectionId!,
      [
        Query.equal("propertyId", propertyIds),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ],
    );

    // Enrich with property names
    const activitiesWithDetails = await Promise.all(
      activities.documents.map(async (activity) => {
        const property = await databases.getDocument(
          config.databaseId!,
          config.propertiesCollectionId!,
          activity.propertyId,
        );

        return {
          id: activity.$id,
          type: activity.type,
          message: `${activity.message} - ${property.propertyName}`,
          time: formatTimeAgo(new Date(activity.createdAt)),
          propertyName: property.propertyName,
        };
      }),
    );

    return activitiesWithDetails;
  } catch (error) {
    console.error("Error getting activities:", error);
    return [];
  }
}

// Helper function to format time
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

// For tenant home screen - only show available properties
// For tenant home screen - only show available properties
export async function getAvailableProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [
      Query.equal("isAvailable", true), // ✅ ONLY show available properties
      Query.orderDesc("$createdAt"),
    ];

    if (filter && filter !== "All")
      buildQuery.push(Query.equal("type", filter));

    const fetchLimit = query && query.trim() !== "" ? 50 : limit || 10;
    buildQuery.push(Query.limit(fetchLimit));

    const result = await databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery,
    );

    // ✅ ADD THIS PROCESSING LOGIC
    let propertiesWithDetails = await Promise.all(
      result.documents.map(async (property) => {
        // Agent - Fetch from USERS collection
        if (property.agent) {
          try {
            const agent = await databases.getDocument(
              config.databaseId!,
              config.usersCollectionId!,
              property.agent,
            );
            property.agent = agent;
          } catch (error) {
            console.error("Error fetching agent from users:", error);
            property.agent = null;
          }
        }

        // Reviews → calculate average rating from JSON string
        if (property.reviews) {
          try {
            const parsedReviews = JSON.parse(property.reviews);
            if (parsedReviews.length > 0) {
              const sum = parsedReviews.reduce(
                (acc: number, r: any) => acc + (r.rating || 0),
                0,
              );
              property.rating = Number((sum / parsedReviews.length).toFixed(1));
            } else {
              property.rating = 0;
            }
          } catch (e) {
            console.error("Error parsing reviews:", e);
            property.rating = 0;
          }
        } else {
          property.rating = 0;
        }

        // Resolve image file IDs into preview URLs (if needed)
        if (property.images && Array.isArray(property.images)) {
          property.images = property.images.map((fileId: string) =>
            storage.getFilePreview(config.bucketId!, fileId),
          );
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
