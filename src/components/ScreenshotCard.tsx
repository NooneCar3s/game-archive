
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Heart,
  MoreHorizontal,
  FolderPlus,
  FolderMinus,
  Gamepad2,
  Trash2,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";

export type Screenshot = {
  id: string;
  title: string;
  game: string;
  date: string;
  image: string;
  thumbnail: string;
  aspect: string;
  favorite: boolean;
  albumId: string | null;
};

export type ScreenshotAction =
  | "album"
  | "remove-album"
  | "game"
  | "delete";

type Props = {
  item: Screenshot;
  onFavorite: (id: string) => void;
  onAction: (action: ScreenshotAction, item: Screenshot) => void;
  isInAlbumView: boolean;
};

export default function ScreenshotCard({
  item,
  onFavorite,
  onAction,
  isInAlbumView,
}: Props) {
  const imageSrc = convertFileSrc(item.thumbnail || item.image);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleAction = (action: ScreenshotAction) => {
    setMenuOpen(false);
    onAction(action, item);
  };

  return (
    <motion.article
      className="screenshot-card"
      whileHover={{ y: -3 }}
    >
      <div className={`screenshot-image ${item.aspect}`}>
        <img src={imageSrc} alt={item.title} loading="lazy" />

        <div className="image-overlay" />

        <div className="card-actions">
          <button
            type="button"
            className={`image-action ${item.favorite ? "is-favorite" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onFavorite(item.id);
            }}
            title="Toggle favorite"
          >
            <Heart
              size={17}
              fill={item.favorite ? "currentColor" : "none"}
            />
          </button>

          <div className="card-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              className={`image-action ${menuOpen ? "is-active" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((current) => !current);
              }}
              title="More options"
            >
              <MoreHorizontal size={18} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="screenshot-context-menu"
                  initial={{ opacity: 0, scale: 0.96, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {isInAlbumView ? (
                    <button
                      className="context-menu-item"
                      onClick={() => handleAction("remove-album")}
                    >
                      <FolderMinus size={16} />
                      <span>Удалить из альбома</span>
                    </button>
                  ) : (
                    <button
                      className="context-menu-item"
                      onClick={() => handleAction("album")}
                    >
                      <FolderPlus size={16} />
                      <span>Add to Album</span>
                    </button>
                  )}

                  <button
                    className="context-menu-item"
                    onClick={() => handleAction("game")}
                  >
                    <Gamepad2 size={16} />
                    <span>
                      {item.game === "Unknown game"
                        ? "Add Game"
                        : "Change Game"}
                    </span>
                  </button>

                  <div className="context-menu-divider" />

                  <button
                    className="context-menu-item danger"
                    onClick={() => handleAction("delete")}
                  >
                    <Trash2 size={16} />
                    <span>Delete Screenshot</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="image-caption">
          <span>{item.game}</span>
        </div>
      </div>

      <div className="card-info">
        <div className="card-date">{item.date}</div>
      </div>
    </motion.article>
  );
}
