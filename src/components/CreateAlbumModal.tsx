
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, FolderPlus } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
};

export default function CreateAlbumModal({
  open,
  onClose,
  onCreate,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || loading) return;

    try {
      setLoading(true);

      await onCreate(trimmedName, description);

      setName("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create album:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="album-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="album-modal"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="album-modal-header">
              <div className="album-modal-icon">
                <FolderPlus size={21} />
              </div>

              <button
                className="album-modal-close"
                onClick={onClose}
              >
                <X size={19} />
              </button>
            </div>

            <h2>Create new album</h2>
            <p className="album-modal-subtitle">
              Give your memories a place of their own.
            </p>

            <div className="album-form">
              <label>ALBUM NAME</label>

              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Night drives in Night City"
                maxLength={60}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleCreate();
                }}
              />

              <label>DESCRIPTION <span>OPTIONAL</span></label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A little story behind this collection..."
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="album-modal-actions">
              <button
                className="album-cancel-button"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                className="album-create-button"
                onClick={handleCreate}
                disabled={!name.trim() || loading}
              >
                <FolderPlus size={16} />
                {loading ? "Creating..." : "Create album"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
