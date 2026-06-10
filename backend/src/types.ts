export interface FetchFilters {
  businessType: string;
  location: string;
  lat: number;
  lng: number;
  radius: number;
  minRating?: number;
  maxResults?: number;
}

export type LeadStatus = "FETCHED" | "APPROVED" | "REJECTED" | "EMAILED" | "REPLIED";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
