import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import IndexPage from "./pages/Index";
import { Toaster } from "@/components/ui/sonner";

const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/Admin"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster richColors position="top-center" />
    </HashRouter>
  </React.StrictMode>
);
