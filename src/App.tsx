
import { useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import Gallery from "./pages/Gallery";
import Settings from "./pages/Settings";
import { initializeDatabase } from "./lib/database";
import "./App.css";

function App() {
  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log("Game Archive database initialized!");
      })
      .catch((error) => {
        console.error("Database initialization failed:", error);
      });
  }, []);

  return (
    <MainLayout>
      {({ active, query, refreshKey, refreshSidebar, onImported }) =>
        active === "settings" ? (
          <Settings onImported={onImported} />
        ) : (
          <Gallery
            active={active}
            query={query}
            refreshKey={refreshKey}
            onSidebarRefresh={refreshSidebar}
          />
        )
      }
    </MainLayout>
  );
}

export default App;
