import { useEffect, useRef } from "react";
import { useParams } from "react-router";
import { Typography, Spin, Card } from "antd";
import { useCustom, useApiUrl } from "@refinedev/core";

const { Title, Text } = Typography;

interface LinkData {
  url: string;
}

export const RedirectPage = () => {
  const { alias } = useParams();
  const redirectedRef = useRef(false);
  
  const url = useApiUrl();
  const { data, isLoading, error } = useCustom<LinkData>({
    url: `${url}/links-alias/${alias}`,
    method: "get",
    config: {
      headers: {
        "Content-Type": "application/json"
      },
    },
  });

  useEffect(() => {
    if (data && !redirectedRef.current) {
      redirectedRef.current = true;
      console.log("Redirecting to:", data.data.url);
      
      // Show loading state for 1 second before redirecting
      setTimeout(() => {
        window.location.href = data.data.url;
      }, 1000);
    }
  }, [data]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Card style={{ width: 500, textAlign: "center" }}>
        {isLoading || (data && !redirectedRef.current) ? (
          <>
            <Spin size="large" />
            <Title level={3} style={{ marginTop: 20 }}>Redirecting...</Title>
            <Text>You will be redirected to the original URL in a moment</Text>
          </>
        ) : (
          <>
            <Title level={3} style={{ color: "red" }}>Redirect Error</Title>
            <Text>{error?.message || "Link not found"}</Text>
          </>
        )}
      </Card>
    </div>
  );
};
