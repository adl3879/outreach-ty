import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import client from "~/api/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Select } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";

interface Settings {
  id: number;
  defaultBizType: string;
  defaultLocation: string;
  defaultRadius: number;
}

const LAGOS_LOCATIONS: { label: string; lat: number; lng: number }[] = [
  { label: "Yaba", lat: 6.5095, lng: 3.3716 },
  { label: "Ikeja", lat: 6.6059, lng: 3.3491 },
  { label: "Abule Egba", lat: 6.6214, lng: 3.3168 },
  { label: "Iyana Ipaja", lat: 6.612, lng: 3.2846 },
  { label: "Victoria Island", lat: 6.4281, lng: 3.4218 },
  { label: "Lekki Phase 1", lat: 6.4478, lng: 3.4737 },
  { label: "Surulere", lat: 6.5033, lng: 3.3513 },
  { label: "Ajah", lat: 6.4669, lng: 3.5708 },
  { label: "Ikoyi", lat: 6.452, lng: 3.4415 },
  { label: "Gbagada", lat: 6.5482, lng: 3.3952 },
  { label: "Abeokuta", lat: 7.155, lng: 3.345 },
  { label: "Gbagada", lat: 6.5482, lng: 3.3952 },
];

const BUSINESS_TYPES = [
  "restaurant",
  "salon",
  "clinic",
  "hotel",
  "bakery",
  "spa",
  "law_firm",
  "real_estate_agency",
  "school",
  "store",
];

export default function FetchLeads() {
  const [businessType, setBusinessType] = useState("restaurant");
  const [location, setLocation] = useState(LAGOS_LOCATIONS[0]);
  const [radius, setRadius] = useState(2000);
  const [minRating, setMinRating] = useState(0);
  const [maxResults, setMaxResults] = useState(20);
  const [resultMessage, setResultMessage] = useState("");

  useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => client.get<Settings>("/settings").then((r) => r.data),
  });

  const fetchMutation = useMutation({
    mutationFn: () =>
      client.post<{ total: number; saved: number }>("/fetch", {
        businessType,
        location: location.label,
        lat: location.lat,
        lng: location.lng,
        radius,
        minRating: minRating > 0 ? minRating : undefined,
        maxResults,
      }),
    onSuccess: (res) => {
      setResultMessage(
        `Found ${res.data.total} places. ${res.data.saved} new leads saved.`
      );
    },
    onError: (err) => {
      setResultMessage(`Error: ${err.message}`);
    },
  });

  return (
    <Card className="max-w-xl w-full">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Fetch Leads</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Business Type</label>
          <Select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Location</label>
          <Select
            value={location.label}
            onChange={(e) => {
              const loc = LAGOS_LOCATIONS.find((l) => l.label === e.target.value);
              if (loc) setLocation(loc);
            }}
          >
            {LAGOS_LOCATIONS.map((l) => (
              <option key={l.label} value={l.label}>
                {l.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Radius: {radius}m</label>
          <Slider
            value={[radius]}
            onValueChange={([v]) => setRadius(v)}
            min={500}
            max={50000}
            step={500}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>500m</span>
            <span>50km</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Min Rating: {minRating}</label>
          <Slider
            value={[minRating]}
            onValueChange={([v]) => setMinRating(v)}
            min={0}
            max={5}
            step={0.5}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Max Results: {maxResults}</label>
          <Slider
            value={[maxResults]}
            onValueChange={([v]) => setMaxResults(v)}
            min={5}
            max={60}
            step={5}
          />
        </div>

        <Button
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending}
          className="w-full"
        >
          {fetchMutation.isPending ? "Fetching..." : "Fetch Leads"}
        </Button>

        {resultMessage && (
          <div className="p-3 rounded-lg bg-muted text-sm">{resultMessage}</div>
        )}
      </CardContent>
    </Card>
  );
}
