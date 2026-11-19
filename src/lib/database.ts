
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

export async function getScreenshots(): Promise<ScreenshotRecord[]> {
  const db = await getDatabase();

  return db.select<ScreenshotRecord[]>(
    `SELECT *
     FROM screenshots
     ORDER BY imported_at DESC`
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
