import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="384829527690-voqjtrcemou5e1428i2rah3dninkqk7u.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);