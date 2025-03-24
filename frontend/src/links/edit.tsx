import { useOne, useUpdate } from "@refinedev/core";
import { Form, Input, Button, Typography, Card, Space, message } from "antd";
import { useParams } from "react-router";
import { useEffect } from "react";
import useRouterProvider from "../providers/router-provider";

const { Title } = Typography;

// Define the link interface
interface Link {
  id: number;
  alias: string;
  url: string;
  accessed: number;
  created_at: string;
  user_id: number;
}

export const EditLink = () => {
  const { id } = useParams<{ id: string }>();
  const { list } = useRouterProvider();
  
  // Fetch link data
  const { data, isLoading: isFetchLoading } = useOne<Link>({
    resource: "links",
    id: id || "",
  });
  
  // Update link
  const { mutate, isLoading: isUpdateLoading, isSuccess } = useUpdate<Link>();

  const link = data?.data;
  
  // Function to validate URL
  const validateUrl = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('Please enter a URL'));
    }
    
    try {
      new URL(value);
      return Promise.resolve();
    } catch (_) {
      return Promise.reject(new Error('Please enter a valid URL'));
    }
  };
  
  // Handle form submission
  const handleSubmit = (values: { url: string; alias: string }) => {
    mutate({
      resource: "links",
      id: id || "",
      values,
    });
  };

  // Handle success with useEffect to only run when success state changes
  useEffect(() => {
    if (isSuccess) {
      message.success('Link updated successfully');
      // Use a timeout to redirect after successful update
      const timer = setTimeout(() => list("links"), 1000);
      // Clean up the timeout if component unmounts before timeout completes
      return () => clearTimeout(timer);
    }
  }, [isSuccess, list]);

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Edit Link</Title>
      <Card>
        {isFetchLoading ? (
          <div>Loading...</div>
        ) : (
          <Form 
            layout="vertical" 
            onFinish={handleSubmit}
            initialValues={{
              url: link?.url,
              alias: link?.alias,
            }}
          >
            <Form.Item 
              label="Original URL" 
              name="url"
              rules={[
                { required: true, message: 'Please enter the URL' },
                { validator: validateUrl }
              ]}
            >
              <Input placeholder="https://example.com" />
            </Form.Item>
            
            <Form.Item 
              label="Short URL Alias" 
              name="alias"
              rules={[{ required: true, message: 'Please enter an alias' }]}
              extra="This will be the text used in your shortened URL: yourdomain.com/r/your-alias"
            >
              <Input placeholder="custom-alias" />
            </Form.Item>
            
            {link && (
              <div style={{ marginBottom: "16px" }}>
                <Title level={5}>Statistics</Title>
                <p>Clicks: {link.accessed || 0}</p>
                <p>Created: {new Date(link.created_at).toLocaleString()}</p>
              </div>
            )}
            
            <div style={{ marginTop: "16px" }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={isUpdateLoading}>
                  Update Link
                </Button>
                <Button onClick={() => list("links")}>
                  Cancel
                </Button>
              </Space>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
};