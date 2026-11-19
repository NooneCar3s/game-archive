
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

type Props = {
    open: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export default function DeleteScreenshotModal({
    open,
    onConfirm,
    onClose,
}: Props) {
    return (
        <AnimatePresence>
            {open && (
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
                        className="delete-confirm-modal"
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.18 }}
                    >
                        <button
                            className="album-picker-close delete-confirm-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="delete-confirm-icon">
                            <AlertTriangle size={23} />
                        </div>

                        <h3>Delete Screenshot?</h3>

                        <p>
                            This screenshot will be permanently deleted.
                            This action cannot be undone.
                        </p>

                        <div className="delete-confirm-actions">
                            <button
                                className="delete-confirm-cancel"
                                onClick={onClose}
                            >
                                Cancel
                            </button>

                            <button
                                className="delete-confirm-submit"
                                onClick={onConfirm}
                            >
                                <Trash2 size={15} />
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
