import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "~/api/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface Lead {
  id: string;
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  userRatingCount: number | null;
  mapsUrl: string;
  onlinePresence: string | null;
  description: string | null;
  priceLevel: string | null;
  businessType: string;
  location: string;
  status: string;
  email: string | null;
  phoneContactedAt: string | null;
  emailSentAt: string | null;
  notes: { id: string; text: string; createdAt: string }[];
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  FETCHED: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  EMAILED: "secondary",
  REPLIED: "default",
};

function renderPrice(level: string | null) {
  if (!level) return null;
  const map: Record<string, string> = {
    FREE: "Free",
    INEXPENSIVE: "$",
    MODERATE: "$$",
    EXPENSIVE: "$$$",
    VERY_EXPENSIVE: "$$$$",
  };
  return map[level] ?? level;
}

export default function LeadsQueue() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", "FETCHED"],
    queryFn: () =>
      client.get<Lead[]>("/leads?status=FETCHED").then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => client.patch(`/leads/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => client.patch(`/leads/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const leads = data ?? [];

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Leads Queue ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {leads.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No fetched leads. Go to Fetch Leads to find some.
            </p>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-3 border rounded-lg p-3 sm:p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium truncate">{lead.name}</h3>
                      <Badge variant={STATUS_VARIANTS[lead.status] ?? "outline"} className="text-xs">
                        {lead.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lead.address}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      {lead.phone && (
                        <span className="text-primary font-medium">{lead.phone}</span>
                      )}
                      {lead.rating && (
                        <span>
                          {"⭐".repeat(Math.round(lead.rating))} {lead.rating}
                          {lead.userRatingCount && <> ({lead.userRatingCount} reviews)</>}
                        </span>
                      )}
                      {renderPrice(lead.priceLevel) && (
                        <span>{renderPrice(lead.priceLevel)}</span>
                      )}
                      <span>{lead.businessType.replace(/_/g, " ")}</span>
                      <span>{lead.location}</span>
                    </div>
                    {lead.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                        {lead.description}
                      </p>
                    )}
                    {lead.onlinePresence && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {lead.onlinePresence}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 sm:shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(lead.id)}
                      className="flex-1 sm:flex-none"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectMutation.mutate(lead.id)}
                      className="flex-1 sm:flex-none"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
