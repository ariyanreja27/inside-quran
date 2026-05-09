import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./tailwind.pcss";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
