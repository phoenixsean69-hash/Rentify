import { ID, Query } from "react-native-appwrite";
import { config, databases } from "./appwrite";
import {
  agentImages,
  galleryImages,
  propertiesImages,
  reviewImages,
} from "./data";

// =============================
// SAMPLE DATA
// =============================

const reviewTexts = [
  "Amazing property, highly recommended!",
  "The agent was very professional and helpful.",
  "Loved the facilities, especially the gym and pool.",
  "Great value for the price, would rent again.",
  "The location could be better, but overall satisfied.",
  "Spacious rooms and modern design, really impressed.",
  "Had some issues with maintenance, but service was responsive.",
  "Perfect for families, safe neighborhood and good schools nearby.",
  "Stylish interiors and well-kept amenities.",
  "Affordable and convenient, exceeded expectations.",
];

const COLLECTIONS = {
  AGENT: config.agentsCollectionId,
  REVIEWS: config.reviewsCollectionId,
  GALLERY: config.galleriesCollectionId,
  PROPERTY: config.propertiesCollectionId,
};

const propertyTypes = [
  "House",
  "Cottage",
  "Duplex",
  "Luxury",
  "Studio",
  "Land",
  "Apartment",
  "Workplace",
  "Other",
];

const facilities = [
  "Laundry",
  "Car Parking",
  "Sports Center",
  "Cutlery",
  "Gym",
  "Swimming pool",
  "Wifi",
  "Pet Center",
];

// =============================
// HELPERS
// =============================

function getRandomSubset<T>(
  array: T[],
  minItems: number,
  maxItems: number,
): T[] {
  const subsetSize =
    Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

  const shuffled = [...array].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, subsetSize);
}

// =============================
// SEED FUNCTION
// =============================

async function seed() {
  try {
    // =============================
    // CLEAR EXISTING DATA
    // =============================

    async function clearCollection(collectionId: string) {
      let hasMore = true;

      while (hasMore) {
        const documents = await databases.listDocuments(
          config.databaseId!,
          collectionId,
          [Query.limit(100)],
        );

        if (documents.documents.length === 0) {
          hasMore = false;
          break;
        }

        await Promise.all(
          documents.documents.map((doc) =>
            databases.deleteDocument(config.databaseId!, collectionId, doc.$id),
          ),
        );
      }
    }

    for (const key in COLLECTIONS) {
      const collectionId = COLLECTIONS[key as keyof typeof COLLECTIONS];
      await clearCollection(collectionId!);
    }

    console.log("Cleared all existing data.");

    // =============================
    // SEED AGENTS
    // =============================

    const agents = [];

    for (let i = 1; i <= 5; i++) {
      const agent = await databases.createDocument(
        config.databaseId!,
        COLLECTIONS.AGENT!,
        ID.unique(),
        {
          name: `Agent ${i}`,
          email: `agent${i}@example.com`,
          avatar: agentImages[Math.floor(Math.random() * agentImages.length)],
        },
      );

      agents.push(agent);
    }

    console.log(`Seeded ${agents.length} agents.`);

    // =============================
    // SEED REVIEWS
    // =============================

    const reviews = [];

    for (let i = 1; i <= 20; i++) {
      const review = await databases.createDocument(
        config.databaseId!,
        COLLECTIONS.REVIEWS!,
        ID.unique(),
        {
          name: `Reviewer ${i}`,
          avatar: reviewImages[Math.floor(Math.random() * reviewImages.length)],
          review: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
          rating: parseFloat((Math.random() * 4 + 1).toFixed(1)), // 1.0 - 5.0
        },
      );

      reviews.push(review);
    }

    console.log(`Seeded ${reviews.length} reviews.`);

    // =============================
    // SEED GALLERY IMAGES
    // =============================

    const galleries = [];

    for (const image of galleryImages) {
      const gallery = await databases.createDocument(
        config.databaseId!,
        COLLECTIONS.GALLERY!,
        ID.unique(),
        {
          image,
          property: null, // relationship field (Many → One)
        },
      );

      galleries.push(gallery);
    }

    console.log(`Seeded ${galleries.length} galleries.`);

    // =============================
    // SEED PROPERTIES
    // =============================

    for (let i = 1; i <= 20; i++) {
      const assignedAgent = agents[Math.floor(Math.random() * agents.length)];

      const assignedReviews = getRandomSubset(reviews, 5, 7);

      const selectedFacilities = getRandomSubset(
        facilities,
        2,
        facilities.length,
      ).join(", ");

      const image =
        propertiesImages[i - 1] ??
        propertiesImages[Math.floor(Math.random() * propertiesImages.length)];

      // ✅ CREATE PROPERTY (NO gallery FIELD)
      const property = await databases.createDocument(
        config.databaseId!,
        COLLECTIONS.PROPERTY!,
        ID.unique(),
        {
          name: `Property ${i}`,
          type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
          description:
            reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
          address: `123 Property Street, City ${i}`,

          // If this is geoPoint type, change format accordingly
          geolocation: `${(-33 + Math.random()).toFixed(
            6,
          )}, ${(18 + Math.random()).toFixed(6)}`,

          price: Math.floor(Math.random() * 9000) + 1000,
          area: parseFloat((Math.random() * 3000 + 500).toFixed(2)),
          bedrooms: Math.floor(Math.random() * 5) + 1,
          bathrooms: Math.floor(Math.random() * 5) + 1,
          rating: parseFloat((Math.random() * 4 + 1).toFixed(1)),

          facilities: selectedFacilities,
          image: image,

          agent: assignedAgent.$id,
          reviews: assignedReviews.map((r) => r.$id),
        },
      );

      // ✅ ASSIGN GALLERIES TO THIS PROPERTY
      const assignedGalleries = getRandomSubset(
        galleries,
        3,
        Math.min(6, galleries.length),
      );

      for (const gallery of assignedGalleries) {
        await databases.updateDocument(
          config.databaseId!,
          COLLECTIONS.GALLERY!,
          gallery.$id,
          {
            property: property.$id,
          },
        );
      }

      console.log(`Seeded property: ${property.name}`);
    }

    console.log("Data seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

export default seed;
