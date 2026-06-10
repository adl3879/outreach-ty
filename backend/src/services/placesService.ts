import { FetchFilters } from "../types";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://places.googleapis.com/v1/places:searchNearby";

const SOCIAL_DOMAINS = ["facebook.com", "instagram.com"];

function isSocialUrl(url: string): boolean {
  return SOCIAL_DOMAINS.some((domain) => url.includes(domain));
}

function isRealWebsite(url: string): boolean {
  return !isSocialUrl(url);
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  mapsUrl: string;
  onlinePresence: string | null;
  description: string | null;
  priceLevel: string | null;
  userRatingCount: number | null;
  businessType: string;
  location: string;
}

const FIELDMASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.editorialSummary",
  "places.priceLevel",
].join(",");

export async function searchPlaces(
  filters: FetchFilters
): Promise<PlaceResult[]> {
  if (!API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set");
  }

  const body = {
    includedTypes: [filters.businessType],
    maxResultCount: filters.maxResults ?? 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: filters.lat,
          longitude: filters.lng,
        },
        radius: filters.radius,
      },
    },
    rankPreference: "DISTANCE",
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": FIELDMASK,
  };

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Places API error: ${response.status} ${err}`);
  }

  const json = (await response.json()) as { places?: any[] };
  const places: any[] = json.places ?? [];

  return places
    .filter((place) => {
      const url = place.websiteUri;
      if (!url) return true;
      if (isSocialUrl(url)) return true;
      if (isRealWebsite(url)) return false;
      return true;
    })
    .filter((place) => {
      if (filters.minRating && place.rating < filters.minRating) return false;
      return true;
    })
    .map((place) => ({
      placeId: place.id,
      name: place.displayName?.text ?? "Unknown",
      address: place.formattedAddress ?? "",
      phone: place.nationalPhoneNumber ?? null,
      rating: place.rating ?? null,
      mapsUrl: place.googleMapsUri ?? "",
      onlinePresence: place.websiteUri ?? null,
      description: place.editorialSummary?.text ?? null,
      priceLevel: place.priceLevel ?? null,
      userRatingCount: place.userRatingCount ?? null,
      businessType: filters.businessType,
      location: filters.location,
    }));
}
