
import { useEffect, useMemo, useState } from "react";
import {
    SlidersHorizontal,
    LayoutGrid,
    ChevronDown,
    Sparkles,
} from "lucide-react";

import ScreenshotCard, {
    type Screenshot,
} from "../components/ScreenshotCard";

import ScreenshotViewer from "../components/ScreenshotViewer";

import {
    initializeDatabase,
    getScreenshots,
    toggleScreenshotFavorite,
} from "../lib/database";

type GalleryProps = {
    query: string;
    active: string;
    refreshKey: number;
};

export default function Gallery({
    query,
    active,
    refreshKey,
}: GalleryProps) {
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(true);

    const [selectedScreenshot, setSelectedScreenshot] =
        useState<Screenshot | null>(null);

    const loadScreenshots = async () => {
        try {
            await initializeDatabase();

            const records = await getScreenshots();

            const formatted: Screenshot[] = records.map((record) => {
                const date = record.imported_at
                    ? new Date(`${record.imported_at.replace(" ", "T")}Z`)
                    : new Date();

                return {
                    id: record.id,
                    title: record.file_name,
                    game: record.game || "Unknown game",
                    date: date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                    }).toUpperCase(),
                    image: record.file_path,
                    aspect: "wide",
                    favorite: record.is_favorite === 1,
                };
            });

            setScreenshots(formatted);
        } catch (error) {
            console.error("Failed to load screenshots:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        loadScreenshots();
    }, [refreshKey]);

    const filtered = useMemo(() => {
        return screenshots.filter((item, index) => {
            const matchesSearch =
                `${item.title} ${item.game}`
                    .toLowerCase()
                    .includes(query.toLowerCase());

            const matchesSection =
                active !== "favorites" || item.favorite;

            const matchesRecent =
                active !== "recent" || index < 3;

            const matchesFilter =
                filter === "All" || item.game === filter;

            return (
                matchesSearch &&
                matchesSection &&
                matchesRecent &&
                matchesFilter
            );
        });
    }, [screenshots, query, active, filter]);

    const toggleFavorite = async (id: string) => {
        const screenshot = screenshots.find((item) => item.id === id);

        if (!screenshot) return;

        const newFavorite = !screenshot.favorite;

        setScreenshots((current) =>
            current.map((item) =>
                item.id === id
                    ? { ...item, favorite: newFavorite }
                    : item
            )
        );

        try {
            await toggleScreenshotFavorite(id, newFavorite);
        } catch (error) {
            console.error("Failed to update favorite:", error);

            setScreenshots((current) =>
                current.map((item) =>
                    item.id === id
                        ? { ...item, favorite: !newFavorite }
                        : item
                )
            );
        }
    };

    const handlePrevious = () => {
        if (!selectedScreenshot || filtered.length === 0) return;

        const index = filtered.findIndex(
            (item) => item.id === selectedScreenshot.id
        );

        const previousIndex =
            (index - 1 + filtered.length) % filtered.length;

        setSelectedScreenshot(filtered[previousIndex]);
    };

    const handleNext = () => {
        if (!selectedScreenshot || filtered.length === 0) return;

        const index = filtered.findIndex(
            (item) => item.id === selectedScreenshot.id
        );

        const nextIndex = (index + 1) % filtered.length;

        setSelectedScreenshot(filtered[nextIndex]);
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
                    <strong>
                        {filtered.length.toString().padStart(2, "0")}
                    </strong>
                    <span>MEMORIES</span>
                </div>
            </div>

            <div className="gallery-toolbar">
                <div className="filter-tabs">
                    {[
                        "All",
                        "GTA V Online",
                        "Cyberpunk 2077",
                        "Red Dead Redemption 2",
                    ].map((name) => (
                        <button
                            key={name}
                            className={`filter-tab ${filter === name ? "selected" : ""
                                }`}
                            onClick={() => setFilter(name)}
                        >
                            {name}
                        </button>
                    ))}
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

            {loading ? (
                <div className="empty-state">
                    <Sparkles size={28} />
                    <h3>Loading your memories...</h3>
                </div>
            ) : filtered.length > 0 ? (
                <div className="gallery-grid">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedScreenshot(item)}
                        >
                            <ScreenshotCard
                                item={item}
                                onFavorite={toggleFavorite}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Sparkles size={28} />
                    <h3>No memories found</h3>
                    <p>
                        Try another search or add some screenshots to your archive.
                    </p>
                </div>
            )}

            <ScreenshotViewer
                item={selectedScreenshot}
                onClose={() => setSelectedScreenshot(null)}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onFavorite={toggleFavorite}
                currentIndex={Math.max(
                    0,
                    filtered.findIndex(
                        (item) => item.id === selectedScreenshot?.id
                    )
                )}
                total={filtered.length}
            />
        </section>
    );
}
