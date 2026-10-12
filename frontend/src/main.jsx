import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { resetScrollOnLoad } from "./lib/pageEffects";
import App from "./App";

resetScrollOnLoad();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
