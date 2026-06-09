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
  Descriptions,
  message,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  StopOutlined,
  LoginOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
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
  OverstayDetail,
  OverstayRecord,
  HandleOverstayParams,
} from '../types/index';

const permissionStatusMap: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '有效' },
  revoked: { color: 'red', label: '已撤销' },
};

const overstayResultMap: Record<string, { color: string; label: string }> = {
  normal_delay: { color: 'blue', label: '正常延时' },
  forgot_badge: { color: 'orange', label: '忘记归还访客牌' },
  abnormal: { color: 'red', label: '异常滞留' },
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
  const [overstayRecords, setOverstayRecords] = useState<OverstayRecord[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [overstayDetailOpen, setOverstayDetailOpen] = useState(false);
  const [overstayHandleOpen, setOverstayHandleOpen] = useState(false);
  const [selectedOverstayVisitor, setSelectedOverstayVisitor] = useState<Visitor | null>(null);
  const [overstayDetail, setOverstayDetail] = useState<OverstayDetail | null>(null);
  const [overstayDetailLoading, setOverstayDetailLoading] = useState(false);
  const [grantForm] = Form.useForm();
  const [recordForm] = Form.useForm();
  const [overstayForm] = Form.useForm();

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

  const fetchOverstayRecords = useCallback(async () => {
    try {
      const res: any = await api.get('/access/overstay/records');
      setOverstayRecords(Array.isArray(res) ? res : []);
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
    fetchOverstayRecords();
    fetchVisitors();
  }, [fetchPermissions, fetchRecords, fetchOverstays, fetchOverstayRecords, fetchVisitors]);

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
      accompanyCount: selectedVisitor?.accompanyCount || 0,
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

  const handleViewOverstayDetail = async (visitor: Visitor) => {
    setSelectedOverstayVisitor(visitor);
    setOverstayDetailLoading(true);
    setOverstayDetailOpen(true);
    try {
      const res: any = await api.get(`/access/overstay/detail/${visitor.id}`);
      setOverstayDetail(res);
    } catch {
      setOverstayDetail(null);
    } finally {
      setOverstayDetailLoading(false);
    }
  };

  const handleOpenOverstayHandle = (visitor: Visitor) => {
    setSelectedOverstayVisitor(visitor);
    overstayForm.resetFields();
    setOverstayHandleOpen(true);
  };

  const handleOverstaySubmit = async (values: any) => {
    if (!selectedOverstayVisitor) return;
    const params: HandleOverstayParams = {
      result: values.result,
      note: values.note,
      handledBy: '安保人员',
    };
    try {
      await api.post(`/access/overstay/handle/${selectedOverstayVisitor.id}`, params);
      const resultMap: Record<string, string> = {
        normal_delay: '正常延时',
        forgot_badge: '忘记归还访客牌',
        abnormal: '异常滞留',
      };
      message.success(`已处置: ${resultMap[values.result] || values.result}`);
      setOverstayHandleOpen(false);
      overstayForm.resetFields();
      fetchOverstays();
      fetchOverstayRecords();
      fetchPermissions();
      fetchVisitors();
    } catch {}
  };

  const permissionColumns = [
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    {
      title: '随行人数',
      dataIndex: 'accompanyCount',
      key: 'accompanyCount',
      render: (val: number) => val > 0 ? <Tag color="orange">{val} 人</Tag> : <Tag>无</Tag>,
    },
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

  const overstayRecordColumns = [
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    {
      title: '最后通行楼层',
      dataIndex: 'lastFloor',
      key: 'lastFloor',
      render: (val: string) => val ? <Tag color="blue">{val}</Tag> : '-',
    },
    {
      title: '最后闸机',
      dataIndex: 'lastGate',
      key: 'lastGate',
      render: (val: string) => val || '-',
    },
    {
      title: '最后通行时间',
      dataIndex: 'lastAccessTime',
      key: 'lastAccessTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '处置结果',
      dataIndex: 'result',
      key: 'result',
      render: (val: string) => {
        if (!val) return '-';
        const info = overstayResultMap[val] || { color: 'default', label: val };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: '备注', dataIndex: 'note', key: 'note', ellipsis: true },
    {
      title: '处理人',
      dataIndex: 'handledBy',
      key: 'handledBy',
      render: (val: string) => val || '-',
    },
    {
      title: '处理时间',
      dataIndex: 'handledAt',
      key: 'handledAt',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
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
            超时滞留处置
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
                <Card
                  size="small"
                  style={{ borderLeft: '3px solid #faad14' }}
                  actions={[
                    <Button
                      key="detail"
                      type="link"
                      size="small"
                      icon={<EnvironmentOutlined />}
                      onClick={() => handleViewOverstayDetail(item)}
                    >
                      楼层定位
                    </Button>,
                    <Button
                      key="handle"
                      type="primary"
                      size="small"
                      icon={<SafetyCertificateOutlined />}
                      onClick={() => handleOpenOverstayHandle(item)}
                    >
                      处置
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        <span>{item.name}</span>
                        <Tag color="red">超时滞留</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>公司: {item.company || '-'}</div>
                        <div>状态: {item.status}</div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card title="滞留处置记录" size="small">
        <Table
          rowKey="id"
          columns={overstayRecordColumns}
          dataSource={overstayRecords}
          pagination={{ pageSize: 5, showTotal: (total) => `共 ${total} 条` }}
          size="small"
        />
      </Card>

      <AlertPanel />

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
                label: `${v.name} - ${v.company || ''}${v.accompanyCount > 0 ? ` (随行${v.accompanyCount}人)` : ''}`,
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
                label: `${v.name} - ${v.company || ''}${v.accompanyCount > 0 ? ` (随行${v.accompanyCount}人)` : ''}`,
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

      <Modal
        title={`楼层定位 - ${selectedOverstayVisitor?.name || ''}`}
        open={overstayDetailOpen}
        onCancel={() => {
          setOverstayDetailOpen(false);
          setOverstayDetail(null);
          setSelectedOverstayVisitor(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setOverstayDetailOpen(false);
            setOverstayDetail(null);
            setSelectedOverstayVisitor(null);
          }}>
            关闭
          </Button>,
          <Button key="handle" type="primary" onClick={() => {
            setOverstayDetailOpen(false);
            if (selectedOverstayVisitor) {
              handleOpenOverstayHandle(selectedOverstayVisitor);
            }
          }}>
            前往处置
          </Button>,
        ]}
        width={560}
      >
        {overstayDetailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : overstayDetail ? (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="访客姓名">{overstayDetail.visitor?.name}</Descriptions.Item>
              <Descriptions.Item label="来访公司">{overstayDetail.visitor?.company || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{overstayDetail.visitor?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color="red">超时滞留</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Card
              title={
                <Space>
                  <EnvironmentOutlined />
                  最后通行位置
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              {overstayDetail.lastAccessPoint ? (
                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{
                        height: 160,
                        background: '#f0f5ff',
                        border: '1px dashed #1677ff',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}>
                        <div style={{ fontSize: 32, color: '#1677ff', marginBottom: 8 }}>
                          <EnvironmentOutlined />
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>
                          {overstayDetail.lastAccessPoint.floor}
                        </div>
                        <div style={{ fontSize: 13, color: '#666' }}>
                          闸机 {overstayDetail.lastAccessPoint.gate}
                        </div>
                        <Tag
                          color={overstayDetail.lastAccessPoint.direction === 'in' ? 'green' : 'orange'}
                          style={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          {overstayDetail.lastAccessPoint.direction === 'in' ? '进入' : '离开'}
                        </Tag>
                      </div>
                    </Col>
                    <Col span={12}>
                      <Timeline
                        items={[
                          {
                            color: 'blue',
                            children: (
                              <>
                                <div style={{ fontWeight: 600 }}>最后通行记录</div>
                                <div>楼层: {overstayDetail.lastAccessPoint.floor}</div>
                                <div>闸机: {overstayDetail.lastAccessPoint.gate}</div>
                                <div>方向: {overstayDetail.lastAccessPoint.direction === 'in' ? '进入' : '离开'}</div>
                              </>
                            ),
                          },
                          {
                            color: 'red',
                            children: (
                              <>
                                <div style={{ fontWeight: 600 }}>通行时间</div>
                                <div>{dayjs(overstayDetail.lastAccessPoint.time).format('YYYY-MM-DD HH:mm:ss')}</div>
                              </>
                            ),
                          },
                        ]}
                      />
                    </Col>
                  </Row>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                  未找到通行记录
                </div>
              )}
            </Card>

            {overstayDetail.permission && (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="门禁有效期至">
                  {dayjs(overstayDetail.permission.validUntil).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="允许楼层">
                  {overstayDetail.permission.allowedFloors?.split(',').map((f: string) => (
                    <Tag color="blue" key={f}>{f}</Tag>
                  ))}
                </Descriptions.Item>
              </Descriptions>
            )}

            <Alert
              message="处置建议"
              description="请前台联系被访员工确认情况，根据实际情况选择处置方式：正常延时（延长门禁2小时）、忘记归还访客牌（强制签离）、异常滞留（强制签离并标记异常）。"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            无法加载滞留详情
          </div>
        )}
      </Modal>

      <Modal
        title={`滞留处置 - ${selectedOverstayVisitor?.name || ''}`}
        open={overstayHandleOpen}
        onCancel={() => {
          setOverstayHandleOpen(false);
          overstayForm.resetFields();
        }}
        onOk={() => overstayForm.submit()}
        width={480}
      >
        <Alert
          message="请先联系被访员工确认情况，再选择处置方式"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          icon={<PhoneOutlined />}
        />
        {selectedOverstayVisitor && (
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="访客姓名">{selectedOverstayVisitor.name}</Descriptions.Item>
            <Descriptions.Item label="来访公司">{selectedOverstayVisitor.company || '-'}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={overstayForm} layout="vertical" onFinish={handleOverstaySubmit}>
          <Form.Item
            name="result"
            label="处置结果"
            rules={[{ required: true, message: '请选择处置结果' }]}
          >
            <Select
              placeholder="请选择处置结果"
              options={[
                {
                  label: '正常延时 - 访客仍在正常访问，延长门禁有效期2小时',
                  value: 'normal_delay',
                },
                {
                  label: '忘记归还访客牌 - 访客已离场但未刷出，强制签离并撤销门禁',
                  value: 'forgot_badge',
                },
                {
                  label: '异常滞留 - 访客超时滞留且无法联系，强制签离并标记异常',
                  value: 'abnormal',
                },
              ]}
            />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="请输入处置备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SecurityPage;
