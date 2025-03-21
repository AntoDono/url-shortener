import { useForm } from "@refinedev/core";
import { Form, Input, Button, Typography, Card, Space, message } from "antd";
import { useParams, useNavigate } from "react-router";
import { useEffect } from "react";

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
  const params = useParams();
  const navigate = useNavigate();
  const linkId = params.id;
  
  const { onFinish, mutation, queryResult } = useForm<Link>({
    meta:{
      headers: {
        "Authorization": `${localStorage.getItem("my_access_token")}`,
      },
    },
    action: "edit",
    resource: "links",
    id: linkId as string,
    
  });

  const record = queryResult?.data?.data;
  
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

  // Handle success with useEffect to only run when success state changes
  useEffect(() => {
    if (mutation.isSuccess) {
      message.success('Link updated successfully');
      // Use a timeout to redirect after successful update
      const timer = setTimeout(() => navigate('/links'), 1000);
      // Clean up the timeout if component unmounts before timeout completes
      return () => clearTimeout(timer);
    }
  }, [mutation.isSuccess, navigate]);

  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Edit Link</Title>
      { queryResult != null ? (
      <Card>
        {/* Wait for data to be loaded before rendering the form */}
        {queryResult.isLoading ? (
          <div>Loading...</div>
        ) : (
          <Form 
            layout="vertical" 
            onFinish={(values) => onFinish(values)}
            initialValues={{
              url: record?.url,
              alias: record?.alias,
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
            
            {record && (
              <div style={{ marginBottom: "16px" }}>
                <Title level={5}>Statistics</Title>
                <p>Clicks: {record.accessed || 0}</p>
                <p>Created: {new Date(record.created_at).toLocaleString()}</p>
              </div>
            )}
            
            <div style={{ marginTop: "16px" }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={mutation.isLoading}>
                  Update Link
                </Button>
                <Button onClick={() => navigate('/links')}>
                  Cancel
                </Button>
              </Space>
            </div>
            
            {mutation.isError && (
              <div style={{ color: "red", marginTop: "16px" }}>
                Error: {mutation.error?.message}
              </div>
            )}
          </Form>
        )}
      </Card>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};