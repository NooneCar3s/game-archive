
import { useMemo, useState } from "react";
import { SlidersHorizontal, LayoutGrid, ChevronDown, Sparkles } from "lucide-react";
import ScreenshotCard, { type Screenshot } from "../components/ScreenshotCard";

const initialScreenshots: Screenshot[] = [
  {
    id: 1,
    title: "Vice City after dark",
    game: "GTA V Online",
    date: "NOV 19, 2026",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000",
    aspect: "tall",
    favorite: true,
  },
  {
    id: 2,
    title: "Golden hour",
    game: "GTA V Online",
    date: "NOV 18, 2026",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1000",
    aspect: "wide",
    favorite: false,
  },
  {
    id: 3,
    title: "City lights",
    game: "Cyberpunk 2077",
    date: "NOV 16, 2026",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1000",
    aspect: "tall",
    favorite: false,
  },
  {
    id: 4,
    title: "Somewhere in the mountains",
    game: "Red Dead Redemption 2",
    date: "NOV 14, 2026",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000",
    aspect: "wide",
    favorite: true,
  },
  {
    id: 5,
    title: "Midnight drive",
    game: "GTA V Online",
    date: "NOV 12, 2026",
    image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1000",
    aspect: "wide",
    favorite: false,
  },
  {
    id: 6,
    title: "The last light",
    game: "GTA V Online",
    date: "NOV 10, 2026",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1000",
    aspect: "tall",
    favorite: false,
  },
];

type GalleryProps = {
  query: string;
  active: string;
};

export default function Gallery({ query, active }: GalleryProps) {
  const [screenshots, setScreenshots] = useState(initialScreenshots);
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    return screenshots.filter((item) => {
      const matchesSearch =
        `${item.title} ${item.game}`.toLowerCase().includes(query.toLowerCase());

      const matchesSection =
        active !== "favorites" || item.favorite;

      const matchesRecent =
        active !== "recent" || item.id <= 3;

      const matchesFilter =
        filter === "All" || item.game === filter;

      return matchesSearch && matchesSection && matchesRecent && matchesFilter;
    });
  }, [screenshots, query, active, filter]);

  const toggleFavorite = (id: number) => {
    setScreenshots((current) =>
      current.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
  };

  const heading =
    active === "favorites"
      ? "Your favorites"
      : active === "recent"
        ? "Recently added"
        : active === "albums"
          ? "Your albums"
          : "All screenshots";

  return (
    <section className="gallery-page">
      <div className="gallery-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={13} />
            YOUR PERSONAL GAME WORLD
          </div>
          <h1>{heading}</h1>
          <p>A collection of moments worth remembering.</p>
        </div>

        <div className="gallery-count">
          <strong>{filtered.length.toString().padStart(2, "0")}</strong>
          <span>MEMORIES</span>
        </div>
      </div>

      <div className="gallery-toolbar">
        <div className="filter-tabs">
          {["All", "GTA V Online", "Cyberpunk 2077", "Red Dead Redemption 2"].map(
            (name) => (
              <button
                key={name}
                className={`filter-tab ${filter === name ? "selected" : ""}`}
                onClick={() => setFilter(name)}
              >
                {name}
              </button>
            )
          )}
        </div>

        <div className="view-actions">
          <button className="toolbar-button">
            <SlidersHorizontal size={16} />
            Filter
          </button>
          <button className="toolbar-button">
            <LayoutGrid size={16} />
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="gallery-grid">
          {filtered.map((item) => (
            <ScreenshotCard
              key={item.id}
              item={item}
              onFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Sparkles size={28} />
          <h3>No memories found</h3>
          <p>Try another search or choose a different collection.</p>
        </div>
      )}
    </section>
  );
}
