import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Modal, Form, Select, message, Empty } from 'antd';
import { PlusOutlined, EyeOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { City, Indicator } from '../types';

const { Option } = Select;

interface Report {
  id: string;
  name: string;
  type: string;
  cities: string;
  indicators: string;
  createdAt: string;
}

const Reports: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [reports, setReports] = useState<Report[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [cities, setCities] = useState<City[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);

  const handleCreateReport = async (values: any) => {
    try {
      const newReport: Report = {
        id: Date.now().toString(),
        name: values.name,
        type: values.type,
        cities: values.cities.join(', '),
        indicators: values.indicators.join(', '),
        createdAt: new Date().toISOString(),
      };
      setReports([...reports, newReport]);
      setIsModalVisible(false);
      form.resetFields();
      messageApi.success('报告创建成功');
    } catch (error) {
      messageApi.error('创建报告失败');
    }
  };

  const handleDeleteReport = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报告吗？',
      onOk: () => {
        setReports(reports.filter(r => r.id !== id));
        messageApi.success('报告已删除');
      },
    });
  };

  const handleDownloadReport = (report: Report) => {
    messageApi.info('报告下载功能开发中...');
  };

  const handleViewReport = (report: Report) => {
    messageApi.info('报告预览功能开发中...');
  };

  const columns = [
    {
      title: '报告名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          'auto': '自动生成',
          'custom': '自定义',
          'prediction': '预测报告',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '覆盖城市',
      dataIndex: 'cities',
      key: 'cities',
      ellipsis: true,
    },
    {
      title: '包含指标',
      dataIndex: 'indicators',
      key: 'indicators',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Report) => (
        <Button.Group>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewReport(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadReport(record)}
          >
            下载
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteReport(record.id)}
          >
            删除
          </Button>
        </Button.Group>
      ),
    },
  ];

  return (
    <div>{contextHolder}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title="我的报告"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                新建报告
              </Button>
            }
          >
            {reports.length === 0 ? (
              <Empty
                description="暂无报告"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={reports}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="新建报告"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateReport}
        >
          <Form.Item
            label="报告名称"
            name="name"
            rules={[{ required: true, message: '请输入报告名称' }]}
          >
            <input
              type="text"
              placeholder="请输入报告名称"
              style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </Form.Item>

          <Form.Item
            label="报告类型"
            name="type"
            rules={[{ required: true, message: '请选择报告类型' }]}
          >
            <Select placeholder="请选择报告类型">
              <Option value="auto">自动生成</Option>
              <Option value="custom">自定义</Option>
              <Option value="prediction">预测报告</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="覆盖城市"
            name="cities"
            rules={[{ required: true, message: '请选择城市' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择城市"
              maxTagCount="responsive"
            >
              {cities.map(city => (
                <Option key={city.city_id} value={city.city_name}>
                  {city.city_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="包含指标"
            name="indicators"
            rules={[{ required: true, message: '请选择指标' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择指标"
              maxTagCount="responsive"
            >
              {indicators.map(indicator => (
                <Option key={indicator.indicator_id} value={indicator.indicator_name}>
                  {indicator.indicator_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reports;
