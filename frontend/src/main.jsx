import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="591216304352-ltmt0cn7ivo8guov86pbt89p1hbqgsd8.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);