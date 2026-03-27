// services/location.service.ts
import { extractTownFromAddress } from "@/constants/towns";
import { config, databases } from "@/lib/appwrite";
import { Query } from "react-native-appwrite";
export interface PopularLocation {
  id: string;
  name: string;
  propertyCount: number;
  color: string;
  properties: any[]; // Sample properties from this location
}

class LocationService {
  // Predefined colors for UI
  private colors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Orange
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#EF4444", // Red
    "#14B8A6", // Teal
    "#F97316", // Orange
  ];

  private extractCityFromAddress(address: string): string | null {
    return extractTownFromAddress(address);
  }

  // Get popular locations from property addresses
  async getPopularLocations(limit: number = 4): Promise<PopularLocation[]> {
    try {
      // Fetch all properties (or a large sample)
      const properties = await databases.listDocuments(
        config.databaseId!,
        config.propertiesCollectionId!,
        [
          Query.limit(100), // Adjust based on your data size
        ],
      );

      console.log(`Fetched ${properties.documents.length} properties`);

      // Count properties by city
      const cityCounts = new Map<
        string,
        { count: number; properties: any[] }
      >();

      properties.documents.forEach((property: any) => {
        const address = property.address || "";
        const city = this.extractCityFromAddress(address);

        if (city) {
          if (!cityCounts.has(city)) {
            cityCounts.set(city, { count: 0, properties: [] });
          }
          const cityData = cityCounts.get(city)!;
          cityData.count += 1;
          cityData.properties.push({
            id: property.$id,
            name: property.name,
            type: property.type,
            price: property.price,
            image: property.image,
          });
        }
      });

      // Convert to array and sort by count (descending)
      const sortedCities = Array.from(cityCounts.entries())
        .map(([name, data], index) => ({
          id: name.toLowerCase().replace(/\s+/g, "-"),
          name,
          propertyCount: data.count,
          properties: data.properties.slice(0, 3), // Keep only 3 sample properties
          color: this.colors[index % this.colors.length],
        }))
        .sort((a, b) => b.propertyCount - a.propertyCount)
        .slice(0, limit);

      console.log("Popular locations:", sortedCities);
      return sortedCities;
    } catch (error) {
      console.error("Error fetching popular locations:", error);
      return this.getFallbackLocations();
    }
  }

  // Get properties in a specific city
  async getPropertiesByCity(city: string): Promise<any[]> {
    try {
      const properties = await databases.listDocuments(
        config.databaseId!,
        config.propertiesCollectionId!,
        [Query.limit(100)],
      );

      // Filter properties that have this city in their address
      const cityProperties = properties.documents.filter((property: any) => {
        const address = property.address || "";
        const extractedCity = this.extractCityFromAddress(address);

        return (
          extractedCity && extractedCity.toLowerCase() === city.toLowerCase()
        );
      });

      return cityProperties;
    } catch (error) {
      console.error(`Error fetching properties in ${city}:`, error);
      return [];
    }
  }

  // Fallback data if backend fails
  private getFallbackLocations(): PopularLocation[] {
    return [
      {
        id: "harare",
        name: "Harare",
        propertyCount: 24,
        properties: [],
        color: "#3B82F6",
      },
      {
        id: "bulawayo",
        name: "Bulawayo",
        propertyCount: 18,
        properties: [],
        color: "#10B981",
      },
      {
        id: "mutare",
        name: "Mutare",
        propertyCount: 15,
        properties: [],
        color: "#F59E0B",
      },
      {
        id: "gweru",
        name: "Gweru",
        propertyCount: 12,
        properties: [],
        color: "#8B5CF6",
      },
    ];
  }
}

export default new LocationService();
