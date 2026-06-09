import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Alert,
  message,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/index';
import AlertPanel from '../components/AlertPanel';
import type {
  MeetingRoom,
  MeetingBooking,
  CreateMeetingBookingParams,
  ExtendBookingParams,
  Visitor,
} from '../types/index';

const roomStatusMap: Record<string, { color: string; label: string }> = {
  available: { color: 'green', label: '空闲' },
  occupied: { color: 'blue', label: '使用中' },
  maintenance: { color: 'orange', label: '维护中' },
};

const bookingStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  cancelled: { color: 'gray', label: '已取消' },
  completed: { color: 'default', label: '已完成' },
};

function MeetingAdminPage() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendingBooking, setExtendingBooking] = useState<MeetingBooking | null>(null);
  const [bookingForm] = Form.useForm();
  const [extendForm] = Form.useForm();

  const fetchRooms = useCallback(async () => {
    setRoomLoading(true);
    try {
      const res: any = await api.get('/meeting-rooms');
      setRooms(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setRoomLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingLoading(true);
    try {
      const res: any = await api.get('/meeting-bookings');
      setBookings(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setBookingLoading(false);
    }
  }, []);

  const fetchConflicts = useCallback(async () => {
    try {
      const res: any = await api.get('/meeting-bookings/conflicts');
      setConflicts(Array.isArray(res) ? res : []);
    } catch {}
  }, []);

  const fetchVisitors = useCallback(async () => {
    try {
      const res: any = await api.get('/visitors');
      setVisitors(Array.isArray(res) ? res : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchBookings();
    fetchConflicts();
    fetchVisitors();
  }, [fetchRooms, fetchBookings, fetchConflicts, fetchVisitors]);

  const getRoomName = (meetingRoomId: number) => {
    const room = rooms.find((r) => r.id === meetingRoomId);
    return room?.name || String(meetingRoomId);
  };

  const handleCreateBooking = async (values: any) => {
    const selectedVisitor = visitors.find((v) => v.id === values.visitorId);
    const params: CreateMeetingBookingParams = {
      meetingRoomId: values.meetingRoomId,
      visitorId: values.visitorId,
      visitorName: selectedVisitor?.name || '',
      startTime: values.timeRange[0].toISOString(),
      endTime: values.timeRange[1].toISOString(),
      teaService: values.teaService || false,
      equipmentNeeded: values.equipmentNeeded || '',
    };
    try {
      await api.post('/meeting-bookings', params);
      message.success('预约创建成功');
      setBookingModalOpen(false);
      bookingForm.resetFields();
      fetchBookings();
      fetchConflicts();
    } catch {}
  };

  const handleCancelBooking = async (id: number) => {
    try {
      await api.patch(`/meeting-bookings/${id}`, { status: 'cancelled' });
      message.success('预约已取消');
      fetchBookings();
      fetchRooms();
    } catch {}
  };

  const handleExtendBooking = async (values: any) => {
    if (!extendingBooking) return;
    const params: ExtendBookingParams = {
      newEndTime: values.newEndTime.toISOString(),
    };
    try {
      await api.post(`/meeting-bookings/${extendingBooking.id}/extend`, params);
      message.success('预约已延长');
      setExtendModalOpen(false);
      setExtendingBooking(null);
      extendForm.resetFields();
      fetchBookings();
    } catch {}
  };

  const openExtendModal = (booking: MeetingBooking) => {
    setExtendingBooking(booking);
    extendForm.setFieldsValue({
      newEndTime: dayjs(booking.endTime).add(30, 'minute'),
    });
    setExtendModalOpen(true);
  };

  const bookingColumns = [
    {
      title: '会议室',
      dataIndex: 'meetingRoomId',
      key: 'meetingRoomId',
      render: (val: number) => getRoomName(val),
    },
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (val: string) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (val: string) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '茶水服务',
      dataIndex: 'teaService',
      key: 'teaService',
      render: (val: boolean) => val ? <Tag color="cyan">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '设备',
      dataIndex: 'equipmentNeeded',
      key: 'equipmentNeeded',
      render: (val: string) =>
        val ? val.split(',').map((e) => <Tag key={e}>{e.trim()}</Tag>) : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = bookingStatusMap[status] || { color: 'default', label: status };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MeetingBooking) =>
        record.status === 'confirmed' || record.status === 'pending' ? (
          <Space>
            <Button
              size="small"
              icon={<ClockCircleOutlined />}
              onClick={() => openExtendModal(record)}
            >
              延长
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleCancelBooking(record.id)}
            >
              取消
            </Button>
          </Space>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        title="会议室管理"
        size="small"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBookingModalOpen(true)}
          >
            新建预约
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {rooms.map((room) => {
            const statusInfo = roomStatusMap[room.status] || { color: 'default', label: room.status };
            return (
              <Col span={6} key={room.id}>
                <Card
                  size="small"
                  title={room.name}
                  extra={<Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
                  hoverable
                >
                  <p style={{ margin: '4px 0' }}>楼层: {room.floor}</p>
                  <p style={{ margin: '4px 0' }}>容量: {room.capacity} 人</p>
                  <div>
                    设备:{' '}
                    {room.equipment
                      ? room.equipment.split(',').map((e) => (
                          <Tag key={e} style={{ marginBottom: 4 }}>{e.trim()}</Tag>
                        ))
                      : '无'}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card title="预约记录" size="small">
        <Table
          rowKey="id"
          columns={bookingColumns}
          dataSource={bookings}
          loading={bookingLoading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </Card>

      <Card
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            冲突预警
          </Space>
        }
        size="small"
      >
        {conflicts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            暂无冲突预警
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {conflicts.map((c, i) => (
              <Col span={12} key={c.id || i}>
                <Alert
                  type="error"
                  showIcon
                  message={c.message || '预约冲突'}
                  description={c.message || ''}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="新建预约"
        open={bookingModalOpen}
        onCancel={() => {
          setBookingModalOpen(false);
          bookingForm.resetFields();
        }}
        onOk={() => bookingForm.submit()}
        width={560}
      >
        <Form form={bookingForm} layout="vertical" onFinish={handleCreateBooking}>
          <Form.Item name="meetingRoomId" label="选择会议室" rules={[{ required: true, message: '请选择会议室' }]}>
            <Select
              placeholder="请选择会议室"
              options={rooms
                .filter((r) => r.status === 'available')
                .map((r) => ({
                  label: `${r.name} (${r.floor}, ${r.capacity}人)`,
                  value: r.id,
                }))}
            />
          </Form.Item>
          <Form.Item name="visitorId" label="选择访客" rules={[{ required: true, message: '请选择访客' }]}>
            <Select
              placeholder="请选择访客"
              options={visitors.map((v) => ({
                label: `${v.name} - ${v.company || ''}`,
                value: v.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="timeRange" label="时间范围" rules={[{ required: true, message: '请选择时间范围' }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="teaService" label="茶水服务" valuePropName="checked">
            <Checkbox>需要茶水服务</Checkbox>
          </Form.Item>
          <Form.Item name="equipmentNeeded" label="所需设备">
            <Input placeholder="请输入设备，多个用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="延长预约时间"
        open={extendModalOpen}
        onCancel={() => {
          setExtendModalOpen(false);
          setExtendingBooking(null);
          extendForm.resetFields();
        }}
        onOk={() => extendForm.submit()}
      >
        {extendingBooking && (
          <div style={{ marginBottom: 16, color: '#666' }}>
            当前预约: {getRoomName(extendingBooking.meetingRoomId)}，结束时间: {dayjs(extendingBooking.endTime).format('YYYY-MM-DD HH:mm')}
          </div>
        )}
        <Form form={extendForm} layout="vertical" onFinish={handleExtendBooking}>
          <Form.Item name="newEndTime" label="新结束时间" rules={[{ required: true, message: '请选择新的结束时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <AlertPanel />
    </div>
  );
}

export default MeetingAdminPage;
