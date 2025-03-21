import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router";
import { Typography, Spin, Card } from "antd";

const { Title, Text } = Typography;

export const RedirectPage = () => {
  const { alias } = useParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const fetchOriginalUrl = async () => {
      // Only proceed if we haven't already fetched
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      
      console.log("Fetching original URL");
      try {
        // Fetch the original URL from the API using the alias
        const response = await fetch(`${import.meta.env.VITE_API_URL}/links/${alias}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error("Link not found");
        }
        
        const data = await response.json();
        
        // Show loading state for 1 second before redirecting
        setTimeout(() => {
            window.location.href = data.url;
          }, 1000);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        setIsLoading(false);
      }
    };

    if (alias) {
      fetchOriginalUrl();
    } else {
      setError("Invalid link");
      setIsLoading(false);
    }
  }, [alias]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Card style={{ width: 500, textAlign: "center" }}>
        {isLoading ? (
          <>
            <Spin size="large" />
            <Title level={3} style={{ marginTop: 20 }}>Redirecting...</Title>
            <Text>You will be redirected to the original URL in a moment</Text>
          </>
        ) : (
          <>
            <Title level={3} style={{ color: "red" }}>Redirect Error</Title>
            <Text>{error}</Text>
          </>
        )}
      </Card>
    </div>
  );
};
