import { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Switch, DatePicker, Button, Table, Tag, Space, message } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/index';
import type { Appointment, CreateAppointmentParams } from '../types/index';

const { TextArea } = Input;

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已拒绝' },
  cancelled: { color: 'gray', label: '已取消' },
};

function EmployeePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/appointments');
      setAppointments(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSubmit = async (values: any) => {
    const params: CreateAppointmentParams = {
      visitorName: values.visitorName,
      visitorCompany: values.visitorCompany,
      visitorPhone: values.visitorPhone,
      purpose: values.purpose,
      expectedTime: values.expectedTime?.toISOString(),
      needMeetingRoom: values.needMeetingRoom || false,
      remark: values.remark || '',
      employeeId: values.employeeId || 1,
      employeeName: values.employeeName || '',
    };
    try {
      await api.post('/appointments', params);
      message.success('预约提交成功');
      form.resetFields();
      fetchAppointments();
    } catch {}
  };

  const handleConfirm = async (id: number) => {
    try {
      await api.patch(`/appointments/${id}`, { status: 'confirmed' });
      message.success('已确认预约');
      fetchAppointments();
    } catch {}
  };

  const handleReject = async (id: number) => {
    try {
      await api.patch(`/appointments/${id}`, { status: 'rejected' });
      message.success('已拒绝预约');
      fetchAppointments();
    } catch {}
  };

  const columns = [
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
      title: '需要会议室',
      dataIndex: 'needMeetingRoom',
      key: 'needMeetingRoom',
      render: (val: boolean) => val ? <Tag color="blue">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Appointment) =>
        record.status === 'pending' ? (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleConfirm(record.id)}
            >
              确认
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleReject(record.id)}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="提交预约" size="small">
        <Form
          form={form}
          layout="inline"
          onFinish={handleSubmit}
          initialValues={{ employeeId: 1, employeeName: '李明' }}
          style={{ flexWrap: 'wrap', gap: '8px 0' }}
        >
          <Form.Item name="employeeName" label="员工姓名" rules={[{ required: true, message: '请输入员工姓名' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="visitorName" label="访客姓名" rules={[{ required: true, message: '请输入访客姓名' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="visitorCompany" label="来访公司" rules={[{ required: true, message: '请输入来访公司' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="visitorPhone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="purpose" label="来访目的" rules={[{ required: true, message: '请输入来访目的' }]}>
            <TextArea rows={1} placeholder="请输入" />
          </Form.Item>
          <Form.Item name="expectedTime" label="预计时间" rules={[{ required: true, message: '请选择预计时间' }]}>
            <DatePicker showTime placeholder="请选择" />
          </Form.Item>
          <Form.Item name="needMeetingRoom" label="需要会议室" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              提交预约
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="我的预约" size="small">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={appointments}
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>
    </div>
  );
}

export default EmployeePage;
