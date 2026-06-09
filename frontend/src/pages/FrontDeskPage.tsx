import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Upload,
  message,
  Alert,
  Badge,
  Descriptions,
  Modal,
  Checkbox,
} from 'antd';
import { UserAddOutlined, LogoutOutlined, CameraOutlined, PrinterOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../api/index';
import type { Appointment, Visitor, RegisterVisitorParams, Companion, RegisterCompanionParams } from '../types/index';
import dayjs from 'dayjs';

const idTypeOptions = [
  { label: '身份证', value: 'id_card' },
  { label: '护照', value: 'passport' },
  { label: '驾照', value: 'driver_license' },
  { label: '其他', value: 'other' },
];

const floorOptions = [
  { label: '1层(前台等候区)', value: '1F' },
  { label: '2层', value: '2F' },
  { label: '3层', value: '3F' },
  { label: '4层', value: '4F' },
  { label: '5层', value: '5F' },
  { label: '6层', value: '6F' },
  { label: '7层', value: '7F' },
  { label: '8层', value: '8F' },
];

const companionStatusMap: Record<string, { color: string; label: string }> = {
  pending_confirmation: { color: 'orange', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已拒绝' },
};

const visitorStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待登记' },
  registered: { color: 'blue', label: '已登记' },
  in_building: { color: 'green', label: '在楼内' },
  left: { color: 'gray', label: '已离开' },
  rejected: { color: 'red', label: '已拒绝' },
};

const appointmentStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已拒绝' },
  cancelled: { color: 'gray', label: '已取消' },
};

function FrontDeskPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [idMismatch, setIdMismatch] = useState(false);
  const [printBadgeVisible, setPrintBadgeVisible] = useState(false);
  const [registeredVisitor, setRegisteredVisitor] = useState<Visitor | null>(null);
  const [companionModalOpen, setCompanionModalOpen] = useState(false);
  const [companionListOpen, setCompanionListOpen] = useState(false);
  const [selectedVisitorForCompanion, setSelectedVisitorForCompanion] = useState<Visitor | null>(null);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [companionsLoading, setCompanionsLoading] = useState(false);
  const [form] = Form.useForm();
  const [companionForm] = Form.useForm();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/appointments', { params: { status: 'confirmed' } });
      const list = Array.isArray(res) ? res : [];
      const registeredIds = visitors
        .filter((v) => v.appointmentId)
        .map((v) => v.appointmentId);
      const available = list.filter((a) => !registeredIds.includes(a.id));
      setAppointments(available);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [visitors]);

  const fetchVisitors = useCallback(async () => {
    setVisitorsLoading(true);
    try {
      const res: any = await api.get('/visitors');
      setVisitors(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setVisitorsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  useEffect(() => {
    if (visitors.length > 0 || !visitorsLoading) {
      fetchAppointments();
    }
  }, [visitors, visitorsLoading]);

  const fetchCompanions = useCallback(async (visitorId: number) => {
    setCompanionsLoading(true);
    try {
      const res: any = await api.get(`/companions/visitor/${visitorId}`);
      setCompanions(Array.isArray(res) ? res : []);
    } catch {
      setCompanions([]);
    } finally {
      setCompanionsLoading(false);
    }
  }, []);

  const handleSelectAppointment = (appointmentId: number) => {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      setSelectedAppointment(apt);
      form.setFieldsValue({
        name: apt.visitorName,
        company: apt.visitorCompany,
        phone: apt.visitorPhone,
      });
      setIdMismatch(false);
    }
  };

  const handleRegister = async (values: any) => {
    if (!selectedAppointment) {
      message.warning('请先选择已确认的预约');
      return;
    }
    const params: RegisterVisitorParams = {
      name: values.name,
      company: values.company,
      phone: values.phone,
      idType: values.idType,
      idNumber: values.idNumber,
      photo: values.photo,
      accompanyCount: values.accompanyCount || 0,
      appointmentId: selectedAppointment.id,
    };
    try {
      const res: any = await api.post('/visitors/register', params);
      if (res?.idMismatch) {
        setIdMismatch(true);
        message.warning('证件信息与预约不匹配，已生成告警');
      } else {
        message.success('访客登记成功');
      }
      setRegisteredVisitor(res);
      setPrintBadgeVisible(true);
      form.resetFields();
      setSelectedAppointment(null);
      setIdMismatch(false);
      fetchVisitors();
    } catch {}
  };

  const handleCheckout = async (id: number) => {
    try {
      await api.post(`/visitors/${id}/checkout`);
      message.success('签离成功，门禁权限已撤销');
      fetchVisitors();
    } catch {}
  };

  const handleIdNumberChange = () => {
    if (idMismatch) {
      setIdMismatch(false);
    }
  };

  const handleOpenCompanionModal = (visitor: Visitor) => {
    setSelectedVisitorForCompanion(visitor);
    companionForm.resetFields();
    companionForm.setFieldsValue({ allowedFloors: ['1F'] });
    setCompanionModalOpen(true);
  };

  const handleRegisterCompanion = async (values: any) => {
    if (!selectedVisitorForCompanion) return;
    const params: RegisterCompanionParams = {
      name: values.name,
      idType: values.idType,
      idNumber: values.idNumber,
      relationship: values.relationship,
      allowedFloors: values.allowedFloors?.join(',') || '1F',
      visitorId: selectedVisitorForCompanion.id,
    };
    try {
      await api.post('/companions', params);
      message.success('随行人员登记成功，已通知被访员工确认。当前仅限前台等候区通行');
      setCompanionModalOpen(false);
      companionForm.resetFields();
      fetchVisitors();
    } catch {}
  };

  const handleViewCompanions = async (visitor: Visitor) => {
    setSelectedVisitorForCompanion(visitor);
    setCompanionListOpen(true);
    await fetchCompanions(visitor.id);
  };

  const appointmentColumns = [
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    { title: '来访公司', dataIndex: 'visitorCompany', key: 'visitorCompany' },
    { title: '联系电话', dataIndex: 'visitorPhone', key: 'visitorPhone' },
    { title: '来访目的', dataIndex: 'purpose', key: 'purpose', ellipsis: true },
    {
      title: '预计时间',
      dataIndex: 'expectedTime',
      key: 'expectedTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '需会议室',
      dataIndex: 'needMeetingRoom',
      key: 'needMeetingRoom',
      render: (val: boolean) => val ? <Tag color="blue">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '被访员工',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
  ];

  const visitorColumns = [
    { title: '访客姓名', dataIndex: 'name', key: 'name' },
    { title: '来访公司', dataIndex: 'company', key: 'company' },
    {
      title: '证件类型',
      dataIndex: 'idType',
      key: 'idType',
      render: (val: string) => {
        const opt = idTypeOptions.find((o) => o.value === val);
        return opt?.label || val;
      },
    },
    {
      title: '证件号码',
      dataIndex: 'idNumber',
      key: 'idNumber',
      render: (val: string) => val ? `${val.substring(0, 4)}****${val.substring(val.length - 4)}` : '-',
    },
    {
      title: '随行人数',
      dataIndex: 'accompanyCount',
      key: 'accompanyCount',
      render: (val: number) => val > 0 ? <Tag color="orange">{val} 人</Tag> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = visitorStatusMap[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Visitor) => (
        <Space size="small">
          {record.status === 'in_building' && (
            <Button
              size="small"
              danger
              icon={<LogoutOutlined />}
              onClick={() => handleCheckout(record.id)}
            >
              签离
            </Button>
          )}
          {record.status === 'registered' && (
            <Tag color="blue">待入场</Tag>
          )}
          {!['in_building', 'registered'].includes(record.status) && (
            <Tag color="gray">{visitorStatusMap[record.status]?.label || record.status}</Tag>
          )}
          {(record.status === 'registered' || record.status === 'in_building') && (
            <>
              <Button
                size="small"
                icon={<UserAddOutlined />}
                onClick={() => handleOpenCompanionModal(record)}
              >
                补录随行
              </Button>
              <Button
                size="small"
                type="link"
                icon={<TeamOutlined />}
                onClick={() => handleViewCompanions(record)}
              >
                查看随行
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const companionColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '证件类型',
      dataIndex: 'idType',
      key: 'idType',
      render: (val: string) => {
        const opt = idTypeOptions.find((o) => o.value === val);
        return opt?.label || val;
      },
    },
    {
      title: '证件号码',
      dataIndex: 'idNumber',
      key: 'idNumber',
      render: (val: string) => val ? `${val.substring(0, 4)}****${val.substring(val.length - 4)}` : '-',
    },
    { title: '与主访客关系', dataIndex: 'relationship', key: 'relationship' },
    {
      title: '允许楼层',
      dataIndex: 'allowedFloors',
      key: 'allowedFloors',
      render: (floors: string) =>
        floors?.split(',').map((f) => <Tag color="blue" key={f}>{f}</Tag>),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = companionStatusMap[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={14}>
          <Card
            title={
              <Space>
                <Badge count={appointments.length} style={{ backgroundColor: '#1677ff' }} />
                已确认预约队列
              </Space>
            }
            size="small"
          >
            <Table
              rowKey="id"
              columns={appointmentColumns}
              dataSource={appointments}
              loading={loading}
              pagination={{ pageSize: 5, showTotal: (total) => `共 ${total} 条待登记` }}
              onRow={(record) => ({
                onClick: () => handleSelectAppointment(record.id),
                style: {
                  cursor: 'pointer',
                  background:
                    selectedAppointment?.id === record.id ? '#e6f4ff' : undefined,
                },
              })}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="访客登记" size="small">
            {idMismatch && (
              <Alert
                message="证件号码不匹配"
                description="所输入的证件信息与预约信息不一致，已生成告警通知安保人员核实，访客仍可登记入场"
                type="warning"
                showIcon
                closable
                style={{ marginBottom: 16 }}
                onClose={() => setIdMismatch(false)}
              />
            )}
            <Form form={form} layout="vertical" onFinish={handleRegister}>
              <Form.Item label="选择已确认预约" required>
                <Select
                  placeholder="请选择员工已确认的预约"
                  value={selectedAppointment?.id}
                  onChange={handleSelectAppointment}
                  options={appointments.map((a) => ({
                    label: `${a.visitorName} - ${a.visitorCompany}（被访: ${a.employeeName}）`,
                    value: a.id,
                  }))}
                />
              </Form.Item>
              <Form.Item name="name" label="访客姓名">
                <Input disabled placeholder="自动从预约填充" />
              </Form.Item>
              <Form.Item name="company" label="来访公司">
                <Input disabled placeholder="自动从预约填充" />
              </Form.Item>
              <Form.Item name="phone" label="联系电话">
                <Input disabled placeholder="自动从预约填充" />
              </Form.Item>
              <Form.Item name="idType" label="证件类型" rules={[{ required: true, message: '请选择证件类型' }]}>
                <Select options={idTypeOptions} placeholder="请选择" />
              </Form.Item>
              <Form.Item name="idNumber" label="证件号码" rules={[{ required: true, message: '请输入证件号码' }]}>
                <Input placeholder="请输入证件号码" onChange={handleIdNumberChange} />
              </Form.Item>
              <Form.Item label="拍照存档">
                <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
                  <CameraOutlined style={{ fontSize: 24 }} />
                </Upload>
              </Form.Item>
              <Form.Item name="accompanyCount" label="随行人数" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} block>
                  登记并打印访客证
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="已登记访客" size="small">
        <Table
          rowKey="id"
          columns={visitorColumns}
          dataSource={visitors}
          loading={visitorsLoading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Modal
        title="访客证"
        open={printBadgeVisible}
        onCancel={() => {
          setPrintBadgeVisible(false);
          setRegisteredVisitor(null);
        }}
        footer={[
          <Button key="close" onClick={() => { setPrintBadgeVisible(false); setRegisteredVisitor(null); }}>
            关闭
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印
          </Button>,
        ]}
        width={400}
      >
        {registeredVisitor && (
          <Card
            size="small"
            style={{
              border: '2px solid #1677ff',
              borderRadius: 8,
              textAlign: 'center',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#1677ff' }}>
              访客证
            </div>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="姓名">{registeredVisitor.name}</Descriptions.Item>
              <Descriptions.Item label="公司">{registeredVisitor.company || '-'}</Descriptions.Item>
              <Descriptions.Item label="证件">
                {idTypeOptions.find((o) => o.value === registeredVisitor.idType)?.label || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="随行人数">{registeredVisitor.accompanyCount}</Descriptions.Item>
              <Descriptions.Item label="登记时间">
                {dayjs(registeredVisitor.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {selectedAppointment && (
                <>
                  <Descriptions.Item label="被访员工">{selectedAppointment.employeeName}</Descriptions.Item>
                  <Descriptions.Item label="来访事由">{selectedAppointment.purpose}</Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>
        )}
      </Modal>

      <Modal
        title={`补录随行人员 - ${selectedVisitorForCompanion?.name || ''}`}
        open={companionModalOpen}
        onCancel={() => {
          setCompanionModalOpen(false);
          companionForm.resetFields();
        }}
        onOk={() => companionForm.submit()}
        width={520}
      >
        <Alert
          message="随行人员须知"
          description="随行人员登记后，需被访员工确认方可通行其他楼层。确认前仅限前台等候区(1F)通行，不可继承主访客门禁权限。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={companionForm} layout="vertical" onFinish={handleRegisterCompanion}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入随行人员姓名" />
          </Form.Item>
          <Form.Item name="idType" label="证件类型" rules={[{ required: true, message: '请选择证件类型' }]}>
            <Select options={idTypeOptions} placeholder="请选择证件类型" />
          </Form.Item>
          <Form.Item name="idNumber" label="证件号码">
            <Input placeholder="请输入证件号码" />
          </Form.Item>
          <Form.Item name="relationship" label="与主访客关系" rules={[{ required: true, message: '请输入关系' }]}>
            <Select
              placeholder="请选择或输入关系"
              options={[
                { label: '同事', value: '同事' },
                { label: '家属', value: '家属' },
                { label: '朋友', value: '朋友' },
                { label: '客户', value: '客户' },
                { label: '助理', value: '助理' },
                { label: '其他', value: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="allowedFloors"
            label="申请通行楼层（待被访员工确认后生效）"
            rules={[{ required: true, message: '请选择通行楼层' }]}
          >
            <Checkbox.Group options={floorOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`随行人员列表 - ${selectedVisitorForCompanion?.name || ''}`}
        open={companionListOpen}
        onCancel={() => {
          setCompanionListOpen(false);
          setCompanions([]);
        }}
        footer={[
          <Button key="close" onClick={() => { setCompanionListOpen(false); setCompanions([]); }}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <Table
          rowKey="id"
          columns={companionColumns}
          dataSource={companions}
          loading={companionsLoading}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无随行人员' }}
        />
      </Modal>
    </div>
  );
}

export default FrontDeskPage;
