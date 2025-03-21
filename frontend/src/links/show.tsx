import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router';
import { format } from 'date-fns';
import { 
  Typography, 
  Descriptions, 
  Table, 
  Spin, 
  Card, 
  Space, 
  Button, 
  Alert, 
  Empty, 
  Tag,
  Tooltip
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table/interface';

const { Title, Text } = Typography;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Define the Link interface based on your requirements
interface AccessLogEntry {
  ip: string;
  user_agent: string;
  timestamp: string;
}

interface Link {
  id: string;
  created_at: string;
  accessed: number;
  url: string;
  user_id: string;
  alias: string;
  access_log: AccessLogEntry[];
}

export const LinkShow = () => {
  const { id } = useParams<{ id: string }>();
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`${API_URL}/links/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch link data');
        }
        const data = await response.json();
        setLink(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
  }, [id]);

  const columns: ColumnsType<AccessLogEntry> = [
    {
      title: 'IP Address',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => <Tag color="blue">{ip}</Tag>,
    },
    {
      title: 'User Agent',
      dataIndex: 'user_agent',
      key: 'user_agent',
      ellipsis: {
        showTitle: false,
      },
      render: (user_agent) => (
        <Tooltip placement="topLeft" title={user_agent}>
          <Text style={{ maxWidth: 400 }} ellipsis>
            {user_agent}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => format(new Date(timestamp), 'PPpp'),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (!link) {
    return <Empty description="Link not found" />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button type="link" icon={<ArrowLeftOutlined />} style={{ paddingLeft: 0 }}>
          <RouterLink to="/links">Back to Links</RouterLink>
        </Button>

        <Title level={2}>Link Details</Title>

        <Card>
          <Descriptions 
            title="Link Information" 
            bordered 
            column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
          >
            <Descriptions.Item label="ID">{link.id}</Descriptions.Item>
            <Descriptions.Item label="Alias">
              <Text strong>{link.alias}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Original URL">
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.url}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {format(new Date(link.created_at), 'PPpp')}
            </Descriptions.Item>
            <Descriptions.Item label="User ID">{link.user_id}</Descriptions.Item>
            <Descriptions.Item label="Access Count">
              <Tag color="green" style={{ fontSize: 16 }}>{link.accessed}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Title level={3}>Access Log</Title>
        
        <Card>
          {link.access_log.length === 0 ? (
            <Empty description="No access records found" />
          ) : (
            <Table 
              columns={columns} 
              dataSource={link.access_log.map((log, index) => ({ ...log, key: index }))}
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Total ${total} records`
              }}
              bordered
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default LinkShow;
