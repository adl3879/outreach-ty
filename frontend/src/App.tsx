import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import FetchLeads from "./pages/FetchLeads";
import LeadsQueue from "./pages/LeadsQueue";
import ApprovedLeads from "./pages/ApprovedLeads";
import Contacted from "./pages/Contacted";
import Settings from "./pages/Settings";
import Trash from "./pages/Trash";

const TABS = [
  { key: "fetch", label: "Fetch", longLabel: "Fetch Leads" },
  { key: "queue", label: "Queue", longLabel: "Leads Queue" },
  { key: "approved", label: "Approved" },
  { key: "contacted", label: "Contacted" },
  { key: "settings", label: "Settings" },
  { key: "trash", label: "Trash" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PAGES: Record<TabKey, React.FC> = {
  fetch: FetchLeads,
  queue: LeadsQueue,
  approved: ApprovedLeads,
  contacted: Contacted,
  settings: Settings,
  trash: Trash,
};

function ThemeToggle() {
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [dark]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} title="Toggle theme">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("fetch");
  const Page = PAGES[tab];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-3 sm:px-6 py-3 flex items-center justify-between">
        <h1 className="text-base sm:text-lg font-bold truncate">Outreach.ty</h1>
        <ThemeToggle />
      </header>

      <div className="px-3 sm:px-6 pt-3 sm:pt-4">
        <Tabs
          defaultValue={tab}
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
        >
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto gap-0 overflow-x-auto">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 sm:px-4 py-2 h-auto text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="sm:hidden">{t.label}</span>
                <span className="hidden sm:inline">{t.longLabel ?? t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="mt-4 sm:mt-6">
            <Page />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
