import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "~/api/client";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

interface Settings {
  id: number;
  defaultBizType: string;
  defaultLocation: string;
  defaultRadius: number;
  updatedAt: string;
}

interface Template {
  id: string;
  businessType: string;
  subject: string;
  body: string;
}

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

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [selectedBizType, setSelectedBizType] = useState("restaurant");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const { data: settings } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => client.get<Settings>("/settings").then((r) => r.data),
  });

  const { data: templates } = useQuery<Template[]>({
    queryFn: () => client.get<Template[]>("/email/templates").then((r) => r.data),
    queryKey: ["templates"],
  });

  const saveTemplateMutation = useMutation({
    mutationFn: () =>
      client.post<Template>("/email/templates", {
        businessType: selectedBizType,
        subject,
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (bizType: string) =>
      client.delete(`/email/templates/${bizType}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  function loadTemplate(bizType: string) {
    setSelectedBizType(bizType);
    const template = (templates ?? []).find((t) => t.businessType === bizType);
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
  }

  const templateList = templates ?? [];

  return (
    <div className="max-w-3xl w-full space-y-6">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Default Fetch Values</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {settings && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Default Business Type: {settings.defaultBizType}</p>
              <p>Default Location: {settings.defaultLocation}</p>
              <p>Default Radius: {settings.defaultRadius}m</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Email Templates</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Each business type has one email template.
          </p>

          <div>
            <label className="text-sm font-medium block mb-2">
              Business Type
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {BUSINESS_TYPES.map((bt) => {
                const exists = templateList.some((t) => t.businessType === bt);
                return (
                  <button
                    key={bt}
                    onClick={() => loadTemplate(bt)}
                    className={`text-xs sm:text-sm px-2.5 py-1 rounded-full border transition-colors ${
                      selectedBizType === bt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {bt.replace(/_/g, " ")}
                    {exists && (
                      <span className="ml-1 text-primary">&#x2713;</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject with {{placeholders}}"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Body</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              placeholder="Email body with {{businessName}}, {{senderName}}, etc."
              className="font-mono text-xs sm:text-sm"
            />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Placeholders: {"{{businessName}} {{businessType}} {{businessAddress}} {{businessPhone}}"}
            {" {{senderName}} {{senderPhone}} {{senderEmail}} {{senderPortfolio}}"}
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => saveTemplateMutation.mutate()}
              disabled={!subject || !body}
              className="w-full sm:w-auto"
            >
              Save Template
            </Button>
            {templateList.some((t) => t.businessType === selectedBizType) && (
              <Button
                variant="destructive"
                onClick={() => deleteTemplateMutation.mutate(selectedBizType)}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            )}
          </div>

          {saveTemplateMutation.isSuccess && (
            <p className="text-sm text-primary">Template saved.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
