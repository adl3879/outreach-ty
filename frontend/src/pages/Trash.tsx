import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "~/api/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface Lead {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  businessType: string;
  location: string;
  status: string;
  description: string | null;
  deletedAt: string;
}

export default function Trash() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", "trash"],
    queryFn: () =>
      client.get<Lead[]>("/leads/trash/list").then((r) => r.data),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => client.patch(`/leads/${id}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/leads/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  const leads = data ?? [];

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Trash ({leads.length})</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {leads.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Trash is empty.
          </p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-3 sm:p-4"
              >
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{lead.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lead.businessType.replace(/_/g, " ")} &mdash; {lead.location}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Trashed: {new Date(lead.deletedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreMutation.mutate(lead.id)}
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm("Permanently delete?")) {
                        deleteMutation.mutate(lead.id);
                      }
                    }}
                  >
                    Delete Forever
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
