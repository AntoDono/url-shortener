import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Typography, Spin, Card } from "antd";
import { useCustom, useApiUrl } from "@refinedev/core";

const { Title, Text } = Typography;

interface LinkData {
  url: string;
}

export const RedirectPage: React.FC = () => {
  const { alias } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(false);
  const url = useApiUrl();

  useEffect(() => {
    if (isMounted.current) return;
    isMounted.current = true;

    const fetchIpAndRedirect = async () => {
      
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        const response = await fetch(`${url}/links-alias/${alias}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ip: ipData.ip
          })
        });

        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          navigate('/404');
        }
      } catch (error) {
        console.error('Redirect error:', error);
        navigate('/404');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIpAndRedirect();
  }, [alias, navigate, url]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Card style={{ width: 500, textAlign: "center" }}>
          <Spin size="large" />
          <Title level={3} style={{ marginTop: 20 }}>Redirecting...</Title>
          <Text>You will be redirected to the original URL in a moment</Text>
        </Card>
      </div>
    );
  }

  return null;
};

