import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import IndexPage from "./pages/Index";
import AdminPage from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors position="top-center" />
    </BrowserRouter>
  </React.StrictMode>
);
