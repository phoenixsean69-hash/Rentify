import icons from "./icons";
import images from "./images";

// constants/avatars.ts
export const avatarImages = [
  { id: "human-1", source: require("@/assets/images/human-1.jpg") },
  { id: "human-2", source: require("@/assets/images/human-2.jpg") },
  { id: "human-3", source: require("@/assets/images/human-3.jpg") },
  { id: "human-4", source: require("@/assets/images/human-4.jpg") },
  { id: "human-5", source: require("@/assets/images/human-5.jpg") },
  { id: "human-6", source: require("@/assets/images/human-6.jpg") },
  { id: "human-7", source: require("@/assets/images/human-7.jpg") },
  { id: "human-8", source: require("@/assets/images/human-8.jpg") },
  { id: "human-9", source: require("@/assets/images/human-9.jpg") },
  { id: "human-10", source: require("@/assets/images/human-10.png") },
  { id: "human-11", source: require("@/assets/images/human-11.jpg") },
  { id: "human-12", source: require("@/assets/images/human-12.jpg") },
  { id: "human-13", source: require("@/assets/images/human-13.jpg") },
  { id: "human-14", source: require("@/assets/images/human-14.jpg") },
  { id: "human-15", source: require("@/assets/images/human-15.jpg") },
  { id: "human-16", source: require("@/assets/images/human-16.jpg") },
  { id: "human-17", source: require("@/assets/images/human-17.jpg") },
  { id: "human-18", source: require("@/assets/images/human-18.jpg") },
  { id: "human-19", source: require("@/assets/images/human-19.jpg") },
  { id: "human-20", source: require("@/assets/images/human-20.jpg") },
  { id: "human-21", source: require("@/assets/images/human-21.jpg") },
  { id: "human-22", source: require("@/assets/images/human-22.jpg") },
  { id: "human-23", source: require("@/assets/images/human-23.jpg") },
  { id: "human-24", source: require("@/assets/images/human-24.jpg") },
  { id: "human-25", source: require("@/assets/images/human-25.jpg") },
  { id: "human-26", source: require("@/assets/images/human-26.jpg") },
  { id: "human-27", source: require("@/assets/images/human-27.jpg") },
  { id: "human-28", source: require("@/assets/images/human-28.jpg") },
  { id: "human-29", source: require("@/assets/images/human-29.jpg") },
  { id: "human-30", source: require("@/assets/images/human-30.jpg") },
  { id: "human-31", source: require("@/assets/images/human-31.jpg") },
  { id: "human-32", source: require("@/assets/images/human-32.jpg") },
  { id: "human-33", source: require("@/assets/images/human-33.png") },
  { id: "human-34", source: require("@/assets/images/human-34.jpg") },
  { id: "human-35", source: require("@/assets/images/human-35.jpg") },
  { id: "human-36", source: require("@/assets/images/human-36.jpg") },
];

// Helper function to get avatar source by ID
export const getAvatarSource = (avatarId: string | null) => {
  if (!avatarId) return avatarImages[0].source;
  const avatar = avatarImages.find((a) => a.id === avatarId);
  return avatar?.source || avatarImages[0].source;
};

export const cards = [
  {
    title: "Card 1",
    location: "Location 1",
    price: "$100",
    rating: 4.8,
    category: "house",
    image: images.newYork,
  },
  {
    title: "Card 2",
    location: "Location 2",
    price: "$200",
    rating: 3,
    category: "house",
    image: images.japan,
  },
  {
    title: "Card 3",
    location: "Location 3",
    price: "$300",
    rating: 2,
    category: "flat",
    image: images.newYork,
  },
  {
    title: "Card 4",
    location: "Location 4",
    price: "$400",
    rating: 5,
    category: "villa",
    image: images.japan,
  },
];

export const featuredCards = [
  {
    title: "Featured 1",
    location: "Location 1",
    price: "$100",
    rating: 4.8,
    image: images.newYork,
    category: "house",
  },
  {
    title: "Featured 2",
    location: "Location 2",
    price: "$200",
    rating: 3,
    image: images.japan,
    category: "flat",
  },
];

export const categories = [
  { title: "All", category: "All" },
  { title: "House", category: "House" },
  { title: "Cottage", category: "Cottage" },
  { title: "Duplex", category: "Duplex" },
  { title: "Luxury", category: "Luxury" },
  { title: "Studio", category: "Studio" },
  { title: "Land", category: "Land" },
  { title: "Apartment", category: "Apartment" },
  { title: "Workplace", category: "Workplace" },
  { title: "Other", category: "Other" },
  { title: "Boarding House", category: "Boarding" },
];

export const facilities = [
  {
    title: "cctv",
    icon: icons.cctv,
  },
  {
    title: "Car Parking",
    icon: icons.carPark,
  },
  {
    title: "Sports Center",
    icon: icons.run,
  },
  {
    title: "B.I.Cs",
    icon: icons.furniture,
  },
  {
    title: "Gym",
    icon: icons.dumbell,
  },
  {
    title: "Swimming pool",
    icon: icons.swim,
  },
  {
    title: "Wifi",
    icon: icons.wifi,
  },
  {
    title: "Pet Center",
    icon: icons.dog,
  },
  {
    title: "Gated",
    icon: icons.walled,
  },
  {
    title: "Solar back Up",
    icon: icons.solar,
  },
  {
    title: "Borehole",
    icon: icons.borehole,
  },
  {
    title: "Tiled",
    icon: icons.tiled,
  },
  {
    title: "Painted",
    icon: icons.painted,
  },
];

export const gallery = [
  {
    id: 1,
    image: images.newYork,
  },
  {
    id: 2,
    image: images.japan,
  },
  {
    id: 3,
    image: images.newYork,
  },
  {
    id: 4,
    image: images.japan,
  },
  {
    id: 5,
    image: images.newYork,
  },
  {
    id: 6,
    image: images.japan,
  },

  {
    id: 7,
    image: images.bed1,
  },
  {
    id: 8,
    image: images.bed2,
  },
  {
    id: 9,
    image: images.bed3,
  },
  {
    id: 10,
    image: images.bed4,
  },
  {
    id: 11,
    image: images.bed5,
  },
  {
    id: 12,
    image: images.bed6,
  },
  {
    id: 13,
    image: images.bed7,
  },
  {
    id: 14,
    image: images.bed8,
  },
  {
    id: 15,
    image: images.bed9,
  },
  {
    id: 16,
    image: images.bed10,
  },
  { id: 17, image: images.nightHouse1 },
  {
    id: 18,
    image: images.nightHouse2,
  },
  {
    id: 19,
    image: images.nightHouse3,
  },
  { id: 20, image: images.dayHouse },
  {
    id: 21,
    image: images.dayHouse2,
  },
  { id: 22, image: images.lounge1 },
  { id: 23, image: images.lounge2 },
  {
    id: 24,
    image: images.lounge3,
  },
  {
    id: 25,
    image: images.lounge4,
  },
  {
    id: 26,
    image: images.lounge5,
  },
  {
    id: 27,
    image: images.lounge6,
  },
  {
    id: 28,
    image: images.lounge7,
  },
  {
    id: 29,
    image: images.lounge8,
  },
  {
    id: 30,
    image: images.lounge9,
  },
  {
    id: 31,
    image: images.lounge10,
  },
  {
    id: 32,
    image: images.lounge11,
  },
  {
    id: 33,
    image: images.lounge12,
  },
  {
    id: 34,
    image: images.lounge13,
  },
];
