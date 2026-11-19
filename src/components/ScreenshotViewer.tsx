
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Screenshot } from "./ScreenshotCard";

type Props = {
  item: Screenshot | null;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onFavorite: (id: string) => void;
  currentIndex: number;
  total: number;
};

export default function ScreenshotViewer({
  item,
  onClose,
  onPrevious,
  onNext,
  onFavorite,
  currentIndex,
  total,
}: Props) {
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrevious();
      if (event.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose, onPrevious, onNext]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="viewer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="viewer-window"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="viewer-topbar">
              <div className="viewer-meta">
                <span className="viewer-game">{item.game}</span>
                <span className="viewer-dot" />
                <span>{item.date}</span>
              </div>

              <button
                className="viewer-close"
                onClick={onClose}
                title="Close"
              >
                <X size={20} />
              </button>
            </header>

            <div className="viewer-image-area">
              <motion.img
                key={item.id}
                src={convertFileSrc(item.image)}
                alt="Game screenshot"
                className="viewer-image"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              />

              <button
                className="viewer-nav viewer-prev"
                onClick={onPrevious}
                title="Previous screenshot"
              >
                <ChevronLeft size={27} />
              </button>

              <button
                className="viewer-nav viewer-next"
                onClick={onNext}
                title="Next screenshot"
              >
                <ChevronRight size={27} />
              </button>
            </div>

            <footer className="viewer-footer">
              <span className="viewer-brand">GAME ARCHIVE</span>

              <div className="viewer-footer-center">
                <span className="viewer-counter">
                  {String(currentIndex + 1).padStart(2, "0")}
                  <span>/</span>
                  {String(total).padStart(2, "0")}
                </span>

                <button
                  className={`viewer-heart ${
                    item.favorite ? "is-favorite" : ""
                  }`}
                  onClick={() => onFavorite(item.id)}
                  title="Toggle favorite"
                >
                  <Heart
                    size={18}
                    fill={item.favorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <span className="viewer-shortcuts">
                ← → NAVIGATE <span>·</span> ESC CLOSE
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
