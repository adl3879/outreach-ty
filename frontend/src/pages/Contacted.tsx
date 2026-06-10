import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "~/api/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

interface Lead {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  userRatingCount: number | null;
  description: string | null;
  priceLevel: string | null;
  businessType: string;
  location: string;
  status: string;
  email: string | null;
  phoneContactedAt: string | null;
  emailSentAt: string | null;
}

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

export default function Contacted() {
  const queryClient = useQueryClient();

  const { data: allLeads, isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", "contacted"],
    queryFn: () => client.get<Lead[]>("/leads").then((r) => r.data),
  });

  const repliedMutation = useMutation({
    mutationFn: (id: string) => client.patch(`/leads/${id}/replied`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  const leads = allLeads ?? [];

  const emailedLeads = leads.filter((l) =>
    ["EMAILED", "REPLIED"].includes(l.status)
  );

  const phoneLeads = leads.filter(
    (l) =>
      l.phoneContactedAt &&
      !["EMAILED", "REPLIED"].includes(l.status)
  );

  if (emailedLeads.length === 0 && phoneLeads.length === 0) {
    return (
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Contacted</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <p className="text-muted-foreground text-sm">No contacted leads yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {emailedLeads.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Emailed ({emailedLeads.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-2">
            {emailedLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border rounded-lg p-3 sm:p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{lead.name}</h4>
                    <Badge variant={lead.status === "REPLIED" ? "default" : "secondary"} className="text-xs">
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lead.businessType.replace(/_/g, " ")} &mdash; {lead.location}
                  </p>
                  {lead.email && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{lead.email}</p>
                  )}
                  {lead.emailSentAt && (
                    <p className="text-xs text-muted-foreground">
                      Sent: {new Date(lead.emailSentAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {lead.status === "EMAILED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => repliedMutation.mutate(lead.id)}
                    className="w-full sm:w-auto"
                  >
                    Mark Replied
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {phoneLeads.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Phone Contacted ({phoneLeads.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-2">
            {phoneLeads.map((lead) => (
              <div key={lead.id} className="border rounded-lg p-3 sm:p-4">
                <h4 className="font-medium">{lead.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {lead.businessType.replace(/_/g, " ")} &mdash; {lead.location}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  {lead.phone && <span className="text-primary">{lead.phone}</span>}
                  {lead.rating && <span>{"⭐".repeat(Math.round(lead.rating))} {lead.rating}</span>}
                  {renderPrice(lead.priceLevel) && <span>{renderPrice(lead.priceLevel)}</span>}
                </div>
                {lead.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lead.description}</p>
                )}
                {lead.phoneContactedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Contacted: {new Date(lead.phoneContactedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
