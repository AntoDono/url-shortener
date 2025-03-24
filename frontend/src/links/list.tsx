import { useList } from "@refinedev/core";
import { Table, Button, Typography, Space, Tag, Tooltip, message, Flex, FlexProps } from "antd";
import { CopyOutlined, EditOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table/interface";
import { useState } from 'react';
import useRouterProvider from "../providers/router-provider";

const { Title } = Typography;

const justifyOptions = [
  'flex-start',
  'center',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly',
];

const alignOptions = [
  'flex-start',
  'center',
  'flex-end',
];

interface LinkType {
  id: string | number;
  alias: string;
  url: string;
  accessed: number;
  created_at: string;
}

export const ListLinks = () => {
  const [current, setCurrent] = useState(1);
  const pageSize = 10;
  const [justify, setJustify] = useState<FlexProps['justify']>(justifyOptions[1]);
  const [alignItems, setAlignItems] = useState<FlexProps['align']>(alignOptions[1]);
  const { show, edit, create } = useRouterProvider();

  const { data, isLoading } = useList<LinkType>({
    resource: "links",
    pagination: {
      current,
      pageSize,
    },
    sorters: [
      {
        field: "created_at",
        order: "desc",
      },
    ],
  });

  // Function to copy link to clipboard
  const copyToClipboard = (alias: string) => {
    const fullUrl = `${window.location.origin}/r/${alias}`;
    navigator.clipboard.writeText(fullUrl);
    message.success("Link copied to clipboard!");
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Define columns for Ant Design Table
  const columns: ColumnsType<LinkType> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "URL Alias",
      dataIndex: "alias",
      key: "alias",
      render: (alias: string) => (
        <Flex justify={justify} align={alignItems}>
          <Tag color="blue">
            {alias}
          </Tag>
        </Flex>
      ),
    },
    {
      title: "Original URL",
      dataIndex: "url",
      key: "url",
      render: (url: string) => (
        <Tooltip title={url}>
          <a>{url.length > 50 ? `${url.substring(0, 50)}...` : url}</a>
        </Tooltip>
      ),
    },
    {
      title: "Clicks",
      dataIndex: "accessed",
      key: "accessed",
      sorter: (a: LinkType, b: LinkType) => a.accessed - b.accessed,
      render: (accessed: number) => <Flex justify={justify} align={alignItems}><Tag color="green">{accessed || 0}</Tag></Flex>,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: LinkType, b: LinkType) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => formatDate(date),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: LinkType) => (
        <Space>
          <Button
            type="primary"
            icon={<CopyOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(record.alias);
            }}
          >
            Copy
          </Button>
          <Button
            type="primary"
            icon={<LinkOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              show("links", record.id);
            }}
          >
            Show
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              edit("links", record.id);
            }}
          >
            Edit
          </Button>
          <Button
            type="default"
            icon={<LinkOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`${window.location.origin}/r/${record.alias}`, '_blank');
            }}
          >
            Visit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: "20px" }}>
        <Title level={2}>Your Shortened Links</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => create("links")}
        >
          Create New Link
        </Button>
      </Flex>
      
      <Table<LinkType>
        dataSource={data?.data}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => {
          return {
            onClick: () => show("links", record.id),
            style: { cursor: 'pointer' }
          };
        }}
        pagination={{
          current: current,
          pageSize: pageSize,
          total: (data?.total || 0),
          onChange: setCurrent,
          showSizeChanger: false,
        }}
        locale={{ emptyText: "You haven't created any links yet" }}
      />
    </div>
  );
};