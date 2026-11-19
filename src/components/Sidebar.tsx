
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Images,
  Heart,
  Folder,
  Gamepad2,
  Settings,
  Plus,
  ChevronDown,
} from "lucide-react";

import type { AlbumRecord } from "../lib/database";

type SidebarProps = {
  active: string;
  onChange: (value: string) => void;
  onCreateAlbum: () => void;
  albums: AlbumRecord[];
  games?: string[];
};

export default function Sidebar({
  active,
  onChange,
  onCreateAlbum,
  albums,
  games = [],
}: SidebarProps) {
  const [albumsExpanded, setAlbumsExpanded] = useState(true);
  const [gamesExpanded, setGamesExpanded] = useState(true);

  return (
    <aside className="sidebar glass-panel">

      {/* BRAND */}
      <div className="brand">
        <div className="brand-icon">
          <Gamepad2 size={21} />
        </div>

        <div>
          <div className="brand-name">GAME ARCHIVE</div>
          <div className="brand-caption">
            YOUR DIGITAL MEMORIES
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="sidebar-scroll">

        {/* MAIN NAVIGATION */}
        <div className="sidebar-section">
          <span className="section-label">LIBRARY</span>

          <nav className="navigation">
            <button
              className={`nav-item ${
                active === "all" ? "active" : ""
              }`}
              onClick={() => onChange("all")}
            >
              {active === "all" && (
                <motion.div
                  layoutId="active-nav"
                  className="nav-highlight"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              <Images size={18} />
              <span>All screenshots</span>
            </button>

            <button
              className={`nav-item ${
                active === "favorites" ? "active" : ""
              }`}
              onClick={() => onChange("favorites")}
            >
              {active === "favorites" && (
                <motion.div
                  layoutId="active-nav"
                  className="nav-highlight"
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              <Heart size={18} />
              <span>Favorites</span>
            </button>
          </nav>
        </div>

        {/* ALBUMS */}
        <div className="sidebar-section sidebar-collection">

          <button
            className="collection-heading"
            onClick={() =>
              setAlbumsExpanded((current) => !current)
            }
          >
            <span className="section-label">ALBUMS</span>

            <ChevronDown
              size={15}
              className={`collection-chevron ${
                albumsExpanded ? "expanded" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {albumsExpanded && (
              <motion.div
                className="collection-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className="collection-list">
                  {albums.length > 0 ? (
                    albums.map((album) => (
                      <button
                        key={album.id}
                        className={`collection-item ${
                          active === `album:${album.id}`
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          onChange(`album:${album.id}`)
                        }
                        title={album.name}
                      >
                        <Folder size={16} />
                        <span>{album.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="collection-empty">
                      No albums yet
                    </div>
                  )}
                </div>

                <button
                  className="create-album-trigger"
                  onClick={onCreateAlbum}
                >
                  <Plus size={16} />
                  <span>Create album</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GAMES */}
        <div className="sidebar-section sidebar-collection">

          <button
            className="collection-heading"
            onClick={() =>
              setGamesExpanded((current) => !current)
            }
          >
            <span className="section-label">GAMES</span>

            <ChevronDown
              size={15}
              className={`collection-chevron ${
                gamesExpanded ? "expanded" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {gamesExpanded && (
              <motion.div
                className="collection-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <div className="collection-list">
                  {games.length > 0 ? (
                    games.map((game) => (
                      <button
                        key={game}
                        className={`collection-item ${
                          active === `game:${game}`
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          onChange(`game:${game}`)
                        }
                        title={game}
                      >
                        <Gamepad2 size={16} />
                        <span>{game}</span>
                      </button>
                    ))
                  ) : (
                    <div className="collection-empty">
                      Games will appear here
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* FIXED BOTTOM */}
      <div className="sidebar-bottom">
        <button className="nav-item settings-item">
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>

    </aside>
  );
}
