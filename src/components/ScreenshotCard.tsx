
import { Heart, MoreHorizontal } from "lucide-react";
import { motion } from "motion/react";

export type Screenshot = {
  id: number;
  title: string;
  game: string;
  date: string;
  image: string;
  aspect: string;
  favorite: boolean;
};

type Props = {
  item: Screenshot;
  onFavorite: (id: number) => void;
};

export default function ScreenshotCard({ item, onFavorite }: Props) {
  return (
    <motion.article
      className="screenshot-card"
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className={`screenshot-image ${item.aspect}`}>
        <img src={item.image} alt={item.title} loading="lazy" />

        <div className="image-overlay" />

        <div className="card-actions">
          <button
            className={`image-action ${item.favorite ? "is-favorite" : ""}`}
            onClick={() => onFavorite(item.id)}
            title="Toggle favorite"
          >
            <Heart
              size={17}
              fill={item.favorite ? "currentColor" : "none"}
            />
          </button>

          <button className="image-action" title="More options">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="image-caption">
          <span>{item.game}</span>
        </div>
      </div>

      <div className="card-info">
        <div className="card-title">{item.title}</div>
        <div className="card-date">{item.date}</div>
      </div>
    </motion.article>
  );
}
