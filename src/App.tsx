
import MainLayout from "./layouts/MainLayout";
import Gallery from "./pages/Gallery";
import "./App.css";

function App() {
  return (
    <MainLayout>
      {({ active, query }) => (
        <Gallery active={active} query={query} />
      )}
    </MainLayout>
  );
}

export default App;
