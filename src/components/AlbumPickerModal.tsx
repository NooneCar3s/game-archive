
import { AnimatePresence, motion } from "motion/react";
import { Folder, X } from "lucide-react";

type Album = {
  id: string;
  name: string;
};

type Props = {
  albums: Album[];
  onSelect: (albumId: string | null) => void;
  onClose: () => void;
};

export default function AlbumPickerModal({
  albums,
  onSelect,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      <motion.div
        className="album-picker-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          className="album-picker-modal"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18 }}
        >
          <div className="album-picker-header">
            <div>
              <h3>Add to Album</h3>
              <p>Select an album for this screenshot</p>
            </div>

            <button
              className="album-picker-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="album-picker-list">
            {albums.length === 0 ? (
              <div className="album-picker-empty">
                No albums available
              </div>
            ) : (
              albums.map((album) => (
                <button
                  key={album.id}
                  className="album-picker-item"
                  onClick={() => onSelect(album.id)}
                >
                  <Folder size={17} />
                  <span>{album.name}</span>
                </button>
              ))
            )}
          </div>

          <button
            className="album-picker-remove"
            onClick={() => onSelect(null)}
          >
            Remove from Album
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
