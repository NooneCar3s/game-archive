
import Database from "@tauri-apps/plugin-sql";

let databasePromise: ReturnType<typeof Database.load> | null = null;
let initializationPromise: Promise<void> | null = null;

export function getDatabase() {
    databasePromise ??= Database.load("sqlite:game-archive.db");
    return databasePromise;
}

export function initializeDatabase(): Promise<void> {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            const db = await getDatabase();

            await db.execute("PRAGMA foreign_keys = ON");

            // Albums
            await db.execute(`
        CREATE TABLE IF NOT EXISTS albums (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

            // Screenshots
            await db.execute(`
        CREATE TABLE IF NOT EXISTS screenshots (
          id TEXT PRIMARY KEY,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL UNIQUE,
          game TEXT,
          description TEXT,
          is_favorite INTEGER NOT NULL DEFAULT 0
            CHECK (is_favorite IN (0, 1)),
          album_id TEXT,
          imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          captured_at TEXT,
          FOREIGN KEY (album_id)
            REFERENCES albums(id)
            ON DELETE SET NULL
        )
      `);

            // Indexes for faster filtering
            await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_screenshots_game
        ON screenshots(game)
      `);

            await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_screenshots_album
        ON screenshots(album_id)
      `);

            await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_screenshots_favorite
        ON screenshots(is_favorite)
      `);
        })().catch((error) => {
            initializationPromise = null;
            throw error;
        });
    }

    return initializationPromise;
}


export type ImportedScreenshot = {
    id: string;
    file_name: string;
    file_path: string;
};

export async function saveScreenshot(screenshot: ImportedScreenshot) {
    const db = await getDatabase();

    await db.execute(
        `INSERT INTO screenshots (id, file_name, file_path)
     VALUES ($1, $2, $3)`,
        [
            screenshot.id,
            screenshot.file_name,
            screenshot.file_path,
        ]
    );
}


export type ScreenshotRecord = {
    id: string;
    file_name: string;
    file_path: string;
    game: string | null;
    description: string | null;
    is_favorite: number;
    album_id: string | null;
    imported_at: string;
    captured_at: string | null;
};


export type ScreenshotFilters = {
    albumId?: string;
    game?: string;
};

export async function getScreenshots(
    filters: ScreenshotFilters = {}
): Promise<ScreenshotRecord[]> {
    const db = await getDatabase();

    return db.select<ScreenshotRecord[]>(
        `SELECT *
     FROM screenshots
     WHERE ($1 IS NULL OR album_id = $1)
       AND ($2 IS NULL OR game = $2)
     ORDER BY imported_at DESC`,
        [
            filters.albumId ?? null,
            filters.game ?? null,
        ]
    );
}


export async function toggleScreenshotFavorite(
    id: string,
    isFavorite: boolean
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `UPDATE screenshots
     SET is_favorite = $1
     WHERE id = $2`,
        [isFavorite ? 1 : 0, id]
    );
}


export type AlbumRecord = {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
};

export async function getAlbums(): Promise<AlbumRecord[]> {
    const db = await getDatabase();

    return db.select<AlbumRecord[]>(
        `SELECT *
     FROM albums
     ORDER BY created_at DESC`
    );
}

export async function createAlbum(
    name: string,
    description?: string
): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `INSERT INTO albums (id, name, description)
     VALUES ($1, $2, $3)`,
        [
            crypto.randomUUID(),
            name.trim(),
            description?.trim() || null,
        ]
    );
}

export async function deleteAlbum(id: string): Promise<void> {
    const db = await getDatabase();

    await db.execute(
        `DELETE FROM albums
     WHERE id = $1`,
        [id]
    );
}


export async function getGames(): Promise<string[]> {
    const db = await getDatabase();

    const records = await db.select<{ game: string }[]>(
        `SELECT DISTINCT game
     FROM screenshots
     WHERE game IS NOT NULL
       AND TRIM(game) <> ''
     ORDER BY game COLLATE NOCASE ASC`
    );

    return records.map((record) => record.game);
}


export async function setScreenshotAlbum(
  screenshotId: string,
  albumId: string | null
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `UPDATE screenshots
     SET album_id = $1
     WHERE id = $2`,
    [albumId, screenshotId]
  );
}


export async function updateScreenshotGame(
  screenshotId: string,
  game: string | null
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `UPDATE screenshots
     SET game = $1
     WHERE id = $2`,
    [game, screenshotId]
  );
}

export async function deleteScreenshot(
  screenshotId: string
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `DELETE FROM screenshots
     WHERE id = $1`,
    [screenshotId]
  );
}

