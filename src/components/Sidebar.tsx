
import {
  Images,
  Heart,
  Clock3,
  FolderHeart,
  Settings,
  Gamepad2,
  Plus,
} from "lucide-react";
import { motion } from "motion/react";

type SidebarProps = {
  active: string;
  onChange: (value: string) => void;
};

const navigation = [
  { id: "all", label: "All screenshots", icon: Images, count: 128 },
  { id: "favorites", label: "Favorites", icon: Heart, count: 12 },
  { id: "recent", label: "Recently added", icon: Clock3, count: 24 },
  { id: "albums", label: "Albums", icon: FolderHeart },
];

export default function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="sidebar glass-panel">
      <div className="brand">
        <div className="brand-icon">
          <Gamepad2 size={21} />
        </div>
        <div>
          <div className="brand-name">GAME ARCHIVE</div>
          <div className="brand-caption">YOUR DIGITAL MEMORIES</div>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="section-label">LIBRARY</span>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id;

            return (
              <button
                key={item.id}
                className={`nav-item ${selected ? "active" : ""}`}
                onClick={() => onChange(item.id)}
              >
                {selected && (
                  <motion.div
                    layoutId="active-nav"
                    className="nav-highlight"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon size={18} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <small>{item.count}</small>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-section albums-section">
        <div className="section-heading">
          <span className="section-label">YOUR GAMES</span>
          <button className="icon-button small" title="Add game">
            <Plus size={16} />
          </button>
        </div>

        <button className="game-item">
          <span className="game-dot gta" />
          <span>GTA V Online</span>
          <small>86</small>
        </button>

        <button className="game-item">
          <span className="game-dot cyberpunk" />
          <span>Cyberpunk 2077</span>
          <small>32</small>
        </button>

        <button className="game-item">
          <span className="game-dot rdr" />
          <span>Red Dead Redemption 2</span>
          <small>10</small>
        </button>
      </div>

      <div className="sidebar-bottom">
        <div className="storage-card">
          <div className="storage-top">
            <span>LOCAL STORAGE</span>
            <span>2.4 GB</span>
          </div>
          <div className="storage-track">
            <div className="storage-progress" />
          </div>
          <span className="storage-caption">Your memories, your device.</span>
        </div>

        <button className="nav-item settings-item">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
