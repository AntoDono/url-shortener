import { useCreate } from "@refinedev/core";
import { Form, Input, Button, Typography, Card, Space, message } from "antd";
import { useEffect } from "react";
import useRouterProvider from "../providers/router-provider";

const { Title } = Typography;

// Define the link interface
interface Link {
  id?: number;
  alias: string;
  url: string;
  accessed?: number;
  created_at?: string;
  user_id?: number;
}

export const CreateLink = () => {
  const { list } = useRouterProvider();
  
  const { mutate, isLoading, isSuccess, error } = useCreate<Link>();
  
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
      values,
    });
  };

  // Handle success with useEffect to only run when success state changes
  useEffect(() => {
    if (isSuccess) {
      message.success('Link created successfully');
      // Use a timeout to redirect after successful creation
      const timer = setTimeout(() => list("links"), 1000);
      // Clean up the timeout if component unmounts before timeout completes
      return () => clearTimeout(timer);
    }
  }, [isSuccess, list]);

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Create New Link</Title>
      <Card>
        <Form 
          layout="vertical" 
          onFinish={handleSubmit}
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
          
          <div style={{ marginTop: "16px" }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                Create Link
              </Button>
              <Button onClick={() => list("links")}>
                Cancel
              </Button>
            </Space>
          </div>
          
          {error && (
            <div style={{ color: "red", marginTop: "16px" }}>
              Error: {error?.message}
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};
