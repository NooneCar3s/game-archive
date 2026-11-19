
import type { ReactNode } from "react";
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

type Props = {
  children: (state: { active: string; query: string }) => ReactNode;
};

export default function MainLayout({ children }: Props) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  return (
    <div className="app-shell">
      <Sidebar active={active} onChange={setActive} />

      <main className="main-content">
        <Topbar query={query} onSearch={setQuery} />
        {children({ active, query })}
      </main>
    </div>
  );
}
