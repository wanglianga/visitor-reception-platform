import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  Switch,
  Row,
  Col,
  Alert,
  Input,
  Checkbox,
  message,
} from 'antd';
import {
  PlusOutlined,
  StopOutlined,
  LoginOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/index';
import AlertPanel from '../components/AlertPanel';
import type {
  AccessPermission,
  AccessRecord,
  CreateAccessPermissionParams,
  CreateAccessRecordParams,
  Visitor,
} from '../types/index';

const permissionStatusMap: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '有效' },
  revoked: { color: 'red', label: '已撤销' },
};

const floorOptions = [
  { label: '1层', value: '1F' },
  { label: '2层', value: '2F' },
  { label: '3层', value: '3F' },
  { label: '4层', value: '4F' },
  { label: '5层', value: '5F' },
  { label: '6层', value: '6F' },
  { label: '7层', value: '7F' },
  { label: '8层', value: '8F' },
];

function SecurityPage() {
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [overstays, setOverstays] = useState<Visitor[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [grantForm] = Form.useForm();
  const [recordForm] = Form.useForm();

  const fetchPermissions = useCallback(async () => {
    setPermLoading(true);
    try {
      const res: any = await api.get('/access/permissions');
      setPermissions(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setPermLoading(false);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setRecordLoading(true);
    try {
      const res: any = await api.get('/access/records');
      setRecords(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setRecordLoading(false);
    }
  }, []);

  const fetchOverstays = useCallback(async () => {
    try {
      const res: any = await api.get('/access/overstay');
      setOverstays(Array.isArray(res) ? res : []);
    } catch {}
  }, []);

  const fetchVisitors = useCallback(async () => {
    try {
      const res: any = await api.get('/visitors');
      setVisitors(Array.isArray(res) ? res : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchRecords();
    fetchOverstays();
    fetchVisitors();
  }, [fetchPermissions, fetchRecords, fetchOverstays, fetchVisitors]);

  const handleRevoke = async (id: number) => {
    try {
      await api.patch(`/access/permissions/${id}`, { status: 'revoked' });
      message.success('权限已撤销');
      fetchPermissions();
    } catch {}
  };

  const handleGateToggle = async (id: number, enabled: boolean) => {
    try {
      await api.patch(`/access/permissions/${id}`, { gateEnabled: enabled });
      message.success(enabled ? '闸机已启用' : '闸机已禁用');
      fetchPermissions();
    } catch {}
  };

  const handleGrantPermission = async (values: any) => {
    const selectedVisitor = visitors.find((v) => v.id === values.visitorId);
    const params: CreateAccessPermissionParams = {
      visitorId: values.visitorId,
      visitorName: selectedVisitor?.name || '',
      allowedFloors: values.allowedFloors.join(','),
      validFrom: values.validTime[0].toISOString(),
      validUntil: values.validTime[1].toISOString(),
    };
    try {
      await api.post('/access/permissions', params);
      message.success('权限已授予');
      setGrantModalOpen(false);
      grantForm.resetFields();
      fetchPermissions();
    } catch {}
  };

  const handleRecordAccess = async (values: any) => {
    const selectedVisitor = visitors.find((v) => v.id === values.visitorId);
    const params: CreateAccessRecordParams = {
      visitorId: values.visitorId,
      visitorName: selectedVisitor?.name || '',
      floor: values.floor,
      gate: values.gate,
      direction: values.direction,
      method: 'manual',
    };
    try {
      await api.post('/access/records', params);
      message.success('通行记录已添加');
      setRecordModalOpen(false);
      recordForm.resetFields();
      fetchRecords();
    } catch {}
  };

  const permissionColumns = [
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    {
      title: '允许楼层',
      dataIndex: 'allowedFloors',
      key: 'allowedFloors',
      render: (floors: string) =>
        floors?.split(',').map((f) => <Tag color="blue" key={f}>{f}</Tag>),
    },
    {
      title: '闸机启用',
      dataIndex: 'gateEnabled',
      key: 'gateEnabled',
      render: (val: boolean, record: AccessPermission) =>
        record.status === 'active' ? (
          <Switch checked={val} onChange={(checked) => handleGateToggle(record.id, checked)} />
        ) : (
          <Switch checked={false} disabled />
        ),
    },
    {
      title: '有效期',
      key: 'validPeriod',
      render: (_: any, record: AccessPermission) =>
        `${dayjs(record.validFrom).format('MM-DD HH:mm')} ~ ${dayjs(record.validUntil).format('MM-DD HH:mm')}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = permissionStatusMap[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AccessPermission) =>
        record.status === 'active' ? (
          <Button
            danger
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleRevoke(record.id)}
          >
            撤销
          </Button>
        ) : (
          '-'
        ),
    },
  ];

  const recordColumns = [
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    { title: '楼层', dataIndex: 'floor', key: 'floor' },
    { title: '闸机', dataIndex: 'gate', key: 'gate' },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      render: (dir: string) =>
        dir === 'in' ? (
          <Tag color="green">进入</Tag>
        ) : (
          <Tag color="orange">离开</Tag>
        ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="通行权限管理"
        size="small"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setGrantModalOpen(true)}
          >
            授予新权限
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={permissionColumns}
          dataSource={permissions}
          loading={permLoading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Card
        title="通行记录"
        size="small"
        extra={
          <Button
            icon={<LoginOutlined />}
            onClick={() => setRecordModalOpen(true)}
          >
            记录通行事件
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={recordColumns}
          dataSource={records}
          loading={recordLoading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Card
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            超时滞留预警
          </Space>
        }
        size="small"
      >
        {overstays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            暂无超时滞留预警
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {overstays.map((item) => (
              <Col span={8} key={item.id}>
                <Alert
                  type="warning"
                  showIcon
                  message={`${item.name} 超时滞留`}
                  description={`公司: ${item.company || '-'}，状态: ${item.status}`}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="授予通行权限"
        open={grantModalOpen}
        onCancel={() => {
          setGrantModalOpen(false);
          grantForm.resetFields();
        }}
        onOk={() => grantForm.submit()}
      >
        <Form form={grantForm} layout="vertical" onFinish={handleGrantPermission}>
          <Form.Item name="visitorId" label="选择访客" rules={[{ required: true, message: '请选择访客' }]}>
            <Select
              placeholder="请选择访客"
              options={visitors.map((v) => ({
                label: `${v.name} - ${v.company || ''}`,
                value: v.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="allowedFloors" label="允许楼层" rules={[{ required: true, message: '请选择楼层' }]}>
            <Checkbox.Group options={floorOptions} />
          </Form.Item>
          <Form.Item name="validTime" label="有效时间" rules={[{ required: true, message: '请选择有效时间' }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="记录通行事件"
        open={recordModalOpen}
        onCancel={() => {
          setRecordModalOpen(false);
          recordForm.resetFields();
        }}
        onOk={() => recordForm.submit()}
      >
        <Form form={recordForm} layout="vertical" onFinish={handleRecordAccess}>
          <Form.Item name="visitorId" label="选择访客" rules={[{ required: true, message: '请选择访客' }]}>
            <Select
              placeholder="请选择访客"
              options={visitors.map((v) => ({
                label: `${v.name} - ${v.company || ''}`,
                value: v.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="floor" label="楼层" rules={[{ required: true, message: '请输入楼层' }]}>
            <Select options={floorOptions} placeholder="请选择楼层" />
          </Form.Item>
          <Form.Item name="gate" label="闸机" rules={[{ required: true, message: '请输入闸机编号' }]}>
            <Input placeholder="例如: A-01" />
          </Form.Item>
          <Form.Item name="direction" label="方向" rules={[{ required: true, message: '请选择方向' }]}>
            <Select
              placeholder="请选择"
              options={[
                { label: '进入', value: 'in' },
                { label: '离开', value: 'out' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <AlertPanel />
    </div>
  );
}

export default SecurityPage;
