
import { AnimatePresence, motion } from "motion/react";
import { Gamepad2, X } from "lucide-react";
import { useState } from "react";

type Props = {
  currentGame: string;
  onSave: (game: string | null) => void;
  onClose: () => void;
};

export default function GamePickerModal({
  currentGame,
  onSave,
  onClose,
}: Props) {
  const [game, setGame] = useState(
    currentGame === "Unknown game" ? "" : currentGame
  );

  const handleSave = () => {
    onSave(game.trim() || null);
  };

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
              <h3>Change Game</h3>
              <p>Specify the game to which this screenshot belongs</p>
            </div>

            <button
              className="album-picker-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <div className="game-picker-input-wrapper">
            <Gamepad2 size={18} />
            <input
              autoFocus
              value={game}
              onChange={(event) => setGame(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
                if (event.key === "Escape") onClose();
              }}
              placeholder="For example, Cyberpunk 2077"
              className="game-picker-input"
            />
          </div>

          <div className="game-picker-actions">
            <button
              className="game-picker-cancel"
              onClick={onClose}
            >
                Cancel
            </button>

            <button
              className="game-picker-save"
              onClick={handleSave}
            >
                Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
