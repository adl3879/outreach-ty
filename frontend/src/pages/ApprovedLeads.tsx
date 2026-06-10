import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Phone, MessageCircle, Trash2 } from "lucide-react";
import client from "~/api/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

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
  notes: Note[];
}

interface Preview {
  subject: string;
  body: string;
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

export default function ApprovedLeads() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sendStatus, setSendStatus] = useState("");
  const [noteText, setNoteText] = useState("");

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["leads", "APPROVED"],
    queryFn: () =>
      client.get<Lead[]>("/leads?status=APPROVED").then((r) => r.data),
  });

  const { data: preview } = useQuery<Preview>({
    queryKey: ["preview", selectedLead?.id],
    queryFn: () =>
      client.get<Preview>(`/email/preview/${selectedLead!.id}`).then((r) => r.data),
    enabled: !!selectedLead,
  });

  const setEmailMutation = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      client.patch(`/leads/${id}/email`, { email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, customBody }: { id: string; customBody?: string }) =>
      client.post(`/email/${id}`, { customBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSendStatus("Email sent successfully!");
      setSelectedLead(null);
    },
    onError: (err) => {
      setSendStatus(`Error: ${err.message}`);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      client.patch<Note>(`/leads/${id}/notes`, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNoteText("");
    },
  });

  const phoneContactMutation = useMutation({
    mutationFn: (id: string) => client.patch(`/leads/${id}/phone-contacted`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const trashMutation = useMutation({
    mutationFn: (id: string) => client.patch(`/leads/${id}/trash`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLead(null);
    },
  });

  function logCall(id: string, text: string) {
    addNoteMutation.mutate({ id, text });
    phoneContactMutation.mutate(id);
  }

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setEmailInput(lead.email ?? "");
    setCustomBody("");
    setSendStatus("");
  }

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  const leadList = leads ?? [];

  if (selectedLead) {
    const whatsappNumber = selectedLead.phone?.replace(/\D/g, "");

    return (
      <Card className="w-full">
        <CardHeader className="px-4 sm:px-6 flex flex-row items-start justify-between space-y-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg">
              {selectedLead.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedLead.address} &middot;{" "}
              {selectedLead.businessType.replace(/_/g, " ")} &middot;{" "}
              {selectedLead.location}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {selectedLead.rating && (
                <span>
                  {"⭐".repeat(Math.round(selectedLead.rating))} {selectedLead.rating}
                  {selectedLead.userRatingCount && <> ({selectedLead.userRatingCount} reviews)</>}
                </span>
              )}
              {renderPrice(selectedLead.priceLevel) && (
                <span>{renderPrice(selectedLead.priceLevel)}</span>
              )}
            </div>
            {selectedLead.description && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {selectedLead.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => trashMutation.mutate(selectedLead.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 space-y-5">
          {selectedLead.phone ? (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium">{selectedLead.phone}</span>
                {selectedLead.phoneContactedAt && (
                  <Badge variant="default" className="text-xs ml-auto">
                    Called
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  asChild
                >
                  <a href={`tel:${selectedLead.phone}`}>Call</a>
                </Button>
                {whatsappNumber && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    asChild
                  >
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    const text = prompt("What happened on this call?");
                    if (text) logCall(selectedLead.id, `Called: ${text}`);
                  }}
                >
                  Log Call
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No phone number available from Google Maps.
            </p>
          )}

          <div className="border-t pt-4 space-y-2">
            <h4 className="text-sm font-medium">Call Notes</h4>
            {selectedLead.notes.length > 0 ? (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {selectedLead.notes.map((note) => (
                  <div key={note.id} className="text-sm bg-muted/50 p-2 rounded-md">
                    <span className="text-muted-foreground text-xs">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <p className="mt-0.5">{note.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && noteText) {
                    addNoteMutation.mutate({ id: selectedLead.id, text: noteText });
                  }
                }}
              />
              <Button
                variant="secondary"
                disabled={!noteText}
                onClick={() =>
                  addNoteMutation.mutate({ id: selectedLead.id, text: noteText })
                }
                className="sm:w-auto"
              >
                Add
              </Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium">Email Follow-Up</h4>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Email Address</label>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setEmailMutation.mutate({ id: selectedLead.id, email: emailInput })
                }
                className="sm:self-end"
              >
                Save
              </Button>
            </div>

            {preview && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Subject: {preview.subject}</p>
                <Textarea
                  value={customBody || preview.body}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={8}
                  className="font-mono text-xs sm:text-sm"
                />
              </div>
            )}

            <Button
              onClick={() =>
                sendMutation.mutate({
                  id: selectedLead.id,
                  customBody: customBody || undefined,
                })
              }
              disabled={sendMutation.isPending || !selectedLead.email}
              className="w-full sm:w-auto"
            >
              {sendMutation.isPending ? "Sending..." : "Send Email"}
            </Button>

            {sendStatus && (
              <div className="p-3 rounded-lg bg-muted text-sm">{sendStatus}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Approved Leads ({leadList.length})</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {leadList.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No approved leads. Go to Leads Queue to approve some.
          </p>
        ) : (
          <div className="space-y-3">
            {leadList.map((lead) => (
              <div
                key={lead.id}
                onClick={() => openLead(lead)}
                className="border rounded-lg p-3 sm:p-4 hover:border-primary/50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{lead.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lead.businessType.replace(/_/g, " ")} &mdash; {lead.location}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{lead.address}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {lead.phone && (
                      <span className="text-xs text-primary font-medium">{lead.phone}</span>
                    )}
                    {lead.rating && (
                      <span className="text-xs text-muted-foreground">
                        {"⭐".repeat(Math.round(lead.rating))} {lead.rating}
                      </span>
                    )}
                    {lead.phoneContactedAt && (
                      <Badge variant="default" className="text-xs">Called</Badge>
                    )}
                    {lead.email ? (
                      <Badge variant="secondary" className="text-xs">{lead.email}</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">No email</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    trashMutation.mutate(lead.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
