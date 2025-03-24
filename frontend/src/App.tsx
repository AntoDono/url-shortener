import { Refine, Authenticated } from "@refinedev/core";
import dataProvider from "@refinedev/simple-rest";
import routerProvider, { NavigateToResource } from "@refinedev/react-router";
import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router";
import axios from "axios";

import { ErrorComponent, RefineThemes, ThemedLayoutV2, useNotificationProvider, AuthPage, ThemedTitleV2, Title } from "@refinedev/antd";
import { App as AntdApp, ConfigProvider } from "antd";

import { authProvider } from "./providers/auth-provider";
import { VerifyEmail } from "./pages/verify-email";

import "@refinedev/antd/dist/reset.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Create an axios instance with auth headers
const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("my_access_token");
  if (token) {
    config.headers["Authorization"] = token;
  }
  return config;
});

// Create a custom data provider using the axios instance
const customDataProvider = dataProvider(API_URL, axiosInstance);

// import { ProductList, ProductShow, ProductEdit, ProductCreate } from "./pages/products";
import { ListLinks } from "./links/list";
import { EditLink } from "./links/edit";
import { CreateLink } from "./links/create";
import { RedirectPage } from "./links/redirect";
import { LinkShow } from "./links/show";
import { LinkOutlined } from "@ant-design/icons";
export default function App() {
  const themelayout = () =>{
    return (
      <ThemedLayoutV2
        Title={() => (
          <ThemedTitleV2 icon={<LinkOutlined />} text="URL Shortener" collapsed={false} />
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
            dataProvider={customDataProvider}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "Links",
                list: "/links",
                show: "/links/view/:id",
                edit: EditLink,
                create: CreateLink
              }
            ]}
            options={{ syncWithLocation: true }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/links" />} />
              <Route path="/r/:alias" element={<RedirectPage />} />
              <Route path="/links/view/:id" element={<LinkShow />} />
              <Route element={<Authenticated key="authenticated" fallback={<Navigate to="/login" />}><Outlet /></Authenticated>}>
                <Route
                  element={
                    themelayout()
                  }
                >
                  <Route path="/links" element={<Outlet />}>
                      <Route index element={<ListLinks />} />
                      <Route path="create" element={<CreateLink />} />
                      <Route path="/links/edit/:id" element={<EditLink />} />
                  </Route>
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Route>
              <Route element={
                <div> 
                  <div style={{
                    display: "flex", 
                    flexDirection: "row", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    marginTop: "100px", 
                    position: "absolute",
                    left: "52%",  // This is needed for proper centering with transform
                    transform: "translate(-50%, -50%)", 
                    scale: "1.5"
                  }}>
                    <ThemedTitleV2 icon={<LinkOutlined style={{ fontSize: "24px" }} />} text="URL Shortener" collapsed={false} />
                  </div>
                  <Authenticated key="auth-pages" fallback={<Outlet />}><NavigateToResource resource="link" /></Authenticated>  
                </div>
              }>
                <Route path="/login" element={<AuthPage type="login" title="" />} />
                <Route path="/register" element={<AuthPage type="register" title="" />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<AuthPage type="forgotPassword" title="" />} />
                <Route path="/reset-password" element={<AuthPage type="updatePassword" title="" />} />
                <Route path="*" element={<ErrorComponent />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
};