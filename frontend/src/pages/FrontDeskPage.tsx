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
} from 'antd';
import { UserAddOutlined, LogoutOutlined, CameraOutlined } from '@ant-design/icons';
import api from '../api/index';
import type { Appointment, Visitor, RegisterVisitorParams } from '../types/index';
import dayjs from 'dayjs';

const idTypeOptions = [
  { label: '身份证', value: 'id_card' },
  { label: '护照', value: 'passport' },
  { label: '驾照', value: 'driver_license' },
  { label: '其他', value: 'other' },
];

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
  const [form] = Form.useForm();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/appointments', { params: { status: 'pending' } });
      setAppointments(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

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
    fetchAppointments();
    fetchVisitors();
  }, [fetchAppointments, fetchVisitors]);

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
      message.warning('请先选择预约');
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
        return;
      }
      message.success('访客登记成功');
      form.resetFields();
      setSelectedAppointment(null);
      setIdMismatch(false);
      fetchVisitors();
    } catch {}
  };

  const handleCheckout = async (id: number) => {
    try {
      await api.post(`/visitors/${id}/checkout`);
      message.success('签离成功');
      fetchVisitors();
    } catch {}
  };

  const handleIdNumberChange = () => {
    if (idMismatch) {
      setIdMismatch(false);
    }
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = appointmentStatusMap[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
  ];

  const visitorColumns = [
    { title: '访客姓名', dataIndex: 'name', key: 'name' },
    { title: '来访公司', dataIndex: 'company', key: 'company' },
    { title: '证件类型', dataIndex: 'idType', key: 'idType',
      render: (val: string) => {
        const opt = idTypeOptions.find((o) => o.value === val);
        return opt?.label || val;
      },
    },
    { title: '随行人数', dataIndex: 'accompanyCount', key: 'accompanyCount' },
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
      render: (_: any, record: Visitor) =>
        record.status === 'in_building' ? (
          <Button
            size="small"
            icon={<LogoutOutlined />}
            onClick={() => handleCheckout(record.id)}
          >
            签离
          </Button>
        ) : (
          <Tag color="gray">{visitorStatusMap[record.status]?.label || record.status}</Tag>
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={14}>
          <Card title="待处理预约队列" size="small">
            <Table
              rowKey="id"
              columns={appointmentColumns}
              dataSource={appointments}
              loading={loading}
              pagination={{ pageSize: 5, showTotal: (total) => `共 ${total} 条` }}
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
                description="所输入的证件号码与预约信息不一致，请核实后再登记"
                type="warning"
                showIcon
                closable
                style={{ marginBottom: 16 }}
                onClose={() => setIdMismatch(false)}
              />
            )}
            <Form form={form} layout="vertical" onFinish={handleRegister}>
              <Form.Item label="选择预约" required>
                <Select
                  placeholder="请选择预约"
                  value={selectedAppointment?.id}
                  onChange={handleSelectAppointment}
                  options={appointments.map((a) => ({
                    label: `${a.visitorName} - ${a.visitorCompany}`,
                    value: a.id,
                  }))}
                />
              </Form.Item>
              <Form.Item name="name" label="访客姓名">
                <Input disabled placeholder="自动填充" />
              </Form.Item>
              <Form.Item name="company" label="来访公司">
                <Input disabled placeholder="自动填充" />
              </Form.Item>
              <Form.Item name="phone" label="联系电话">
                <Input disabled placeholder="自动填充" />
              </Form.Item>
              <Form.Item name="idType" label="证件类型" rules={[{ required: true, message: '请选择证件类型' }]}>
                <Select options={idTypeOptions} placeholder="请选择" />
              </Form.Item>
              <Form.Item name="idNumber" label="证件号码" rules={[{ required: true, message: '请输入证件号码' }]}>
                <Input placeholder="请输入" onChange={handleIdNumberChange} />
              </Form.Item>
              <Form.Item label="拍照">
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
    </div>
  );
}

export default FrontDeskPage;
