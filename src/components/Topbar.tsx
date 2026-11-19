
import { Search, Plus, Command } from "lucide-react";

type TopbarProps = {
  query: string;
  onSearch: (value: string) => void;
};

export default function Topbar({ query, onSearch }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>LIBRARY</span>
        <span className="breadcrumb-divider">/</span>
        <strong>All screenshots</strong>
      </div>

      <div className="topbar-actions">
        <div className="search-box glass-panel">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search your memories..."
          />
          <div className="shortcut">
            <Command size={11} /> K
          </div>
        </div>

        <button className="add-button">
          <Plus size={18} />
          <span>Add screenshots</span>
        </button>
      </div>
    </header>
  );
}
