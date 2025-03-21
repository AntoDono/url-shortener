import { Refine, Authenticated } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";
import routerProvider, { NavigateToResource } from "@refinedev/react-router";
import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router";

import { ErrorComponent, RefineThemes, ThemedLayoutV2, useNotificationProvider, AuthPage, ThemedTitleV2 } from "@refinedev/antd";
import { App as AntdApp, ConfigProvider } from "antd";

import { authProvider } from "./providers/auth-provider";

import "@refinedev/antd/dist/reset.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";


// import { ProductList, ProductShow, ProductEdit, ProductCreate } from "./pages/products";
import { ListLinks } from "./links/list";
import { EditLink } from "./links/edit";
import { CreateLink } from "./links/create";
import { RedirectPage } from "./links/redirect";

export default function App() {
  const themelayout = () =>{
    return (
      <ThemedLayoutV2
        Title={() => (
          <ThemedTitleV2 text="URL Shortener" collapsed={false} />
        )}
      >
        <Outlet />
      </ThemedLayoutV2>
    )
  }

  return (
    <BrowserRouter>
      <ConfigProvider theme={RefineThemes.Purple}>
        <AntdApp>
          <Refine
            routerProvider={routerProvider}
            dataProvider={dataProvider(API_URL)}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "Links",
                list: "/links",
                show: "/r/:alias",
                edit: EditLink,
                create: CreateLink
              }
            ]}
            options={{ syncWithLocation: true }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/links" />} />
              <Route path="/r/:alias" element={<RedirectPage />} />
              <Route element={<Authenticated key="authenticated" fallback={<Navigate to="/login" />}><Outlet /></Authenticated>}>
                <Route
                  element={
                    themelayout()
                  }
                >
                  <Route path="/links" element={<Outlet />}>
                      <Route index element={<ListLinks />} />
                      <Route path="create" element={<CreateLink />} />
                      {/* <Route path=":id" element={<ProductShow />} /> */}
                      <Route path="/links/edit/:id" element={<EditLink />} />
                  </Route>
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Route>
              <Route element={
                <Authenticated key="auth-pages" fallback={<Outlet />}><NavigateToResource resource="link" /></Authenticated>}>
                <Route path="/login" element={<AuthPage type="login" title="URL Shortener" />} />
                <Route path="/register" element={<AuthPage type="register" title="URL Shortener" />} />
                <Route path="/forgot-password" element={<AuthPage type="forgotPassword" title="URL Shortener" />} />
                <Route path="/reset-password" element={<AuthPage type="updatePassword" title="URL Shortener" />} />
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};