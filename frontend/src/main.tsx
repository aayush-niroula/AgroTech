import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import {ThemeProvider} from '@/components/theme-provider';
import { AuthProvider } from "./context/AuthContext.tsx";
import { store } from "./app/store.ts";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
  <BrowserRouter>
  <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
    <AuthProvider>
    <App />
    </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  </Provider>
);
