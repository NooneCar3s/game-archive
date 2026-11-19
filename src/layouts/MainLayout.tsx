
import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

type Props = {
  children: (state: {
    active: string;
    query: string;
    refreshKey: number;
  }) => ReactNode;
};

export default function MainLayout({ children }: Props) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImported = () => {
    setRefreshKey((current) => current + 1);
  };

  return (
    <div className="app-shell">
      <Sidebar active={active} onChange={setActive} />

      <main className="main-content">
        <Topbar
          query={query}
          onSearch={setQuery}
          onImported={handleImported}
        />

        {children({ active, query, refreshKey })}
      </main>
    </div>
  );
}
