import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import IndexPage from "./pages/Index";

const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/Admin"));
// Só o /admin dispara toast; carregar o sonner na landing colocava a
// biblioteca inteira no bundle que o comprador baixa.
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster }))
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route
            path="/admin"
            element={
              <>
                <AdminPage />
                <Toaster richColors position="top-center" />
              </>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </HashRouter>
  </React.StrictMode>
);
