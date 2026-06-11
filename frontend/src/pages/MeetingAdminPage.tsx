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
  Badge,
  message,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/index';
import type {
  MeetingRoom,
  MeetingBooking,
  CreateMeetingBookingParams,
  ExtendBookingParams,
  MeetingExtensionRequest,
  RequestExtensionParams,
  HandleExtensionRequestParams,
  Visitor,
  Alert as AlertType,
} from '../types/index';

const { TextArea } = Input;

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
  const [conflictAlerts, setConflictAlerts] = useState<AlertType[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendingBooking, setExtendingBooking] = useState<MeetingBooking | null>(null);
  const [extensionRequests, setExtensionRequests] = useState<MeetingExtensionRequest[]>([]);
  const [extensionRequestsLoading, setExtensionRequestsLoading] = useState(false);
  const [requestExtensionModalOpen, setRequestExtensionModalOpen] = useState(false);
  const [handleExtensionModalOpen, setHandleExtensionModalOpen] = useState(false);
  const [selectedExtensionRequest, setSelectedExtensionRequest] = useState<MeetingExtensionRequest | null>(null);
  const [bookingForm] = Form.useForm();
  const [extendForm] = Form.useForm();
  const [requestExtensionForm] = Form.useForm();
  const [handleExtensionForm] = Form.useForm();

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

  const fetchConflictAlerts = useCallback(async () => {
    try {
      const res: any = await api.get('/alerts', { params: { type: 'meeting_conflict' } });
      setConflictAlerts(Array.isArray(res) ? res : []);
    } catch {}
  }, []);

  const fetchVisitors = useCallback(async () => {
    try {
      const res: any = await api.get('/visitors');
      setVisitors(Array.isArray(res) ? res : []);
    } catch {}
  }, []);

  const fetchExtensionRequests = useCallback(async () => {
    setExtensionRequestsLoading(true);
    try {
      const res: any = await api.get('/meeting-extension-requests', { params: { status: 'pending' } });
      setExtensionRequests(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setExtensionRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchBookings();
    fetchConflictAlerts();
    fetchVisitors();
    fetchExtensionRequests();
    const interval = setInterval(fetchConflictAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchRooms, fetchBookings, fetchConflictAlerts, fetchVisitors, fetchExtensionRequests]);

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
      fetchConflictAlerts();
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

  const handleRequestExtension = async (values: any) => {
    if (!extendingBooking) return;
    const params: RequestExtensionParams = {
      newEndTime: values.newEndTime.toISOString(),
      requestedBy: '会议室管理员',
    };
    try {
      await api.post(`/meeting-bookings/${extendingBooking.id}/request-extension`, params);
      message.success('延时申请已提交');
      setRequestExtensionModalOpen(false);
      setExtendingBooking(null);
      requestExtensionForm.resetFields();
      fetchExtensionRequests();
      fetchBookings();
    } catch {}
  };

  const openRequestExtensionModal = (booking: MeetingBooking) => {
    setExtendingBooking(booking);
    requestExtensionForm.setFieldsValue({
      newEndTime: dayjs(booking.endTime).add(30, 'minute'),
    });
    setRequestExtensionModalOpen(true);
  };

  const handleApproveExtension = async (
    request: MeetingExtensionRequest,
    roomChanged: boolean,
    suggestedRoomId?: number,
  ) => {
    const params: HandleExtensionRequestParams = {
      status: 'approved',
      handledBy: '会议室管理员',
      roomChanged,
      ...(roomChanged && suggestedRoomId ? { suggestedRoomId } : {}),
    };
    try {
      await api.patch(`/meeting-extension-requests/${request.id}/handle`, params);
      message.success(roomChanged ? '已批准并更换会议室' : '延时申请已批准');
      fetchExtensionRequests();
      fetchBookings();
      fetchRooms();
    } catch {}
  };

  const handleRejectExtension = async (values: any) => {
    if (!selectedExtensionRequest) return;
    const params: HandleExtensionRequestParams = {
      status: 'rejected',
      handledBy: '会议室管理员',
      rejectedReason: values.rejectedReason,
    };
    try {
      await api.patch(`/meeting-extension-requests/${selectedExtensionRequest.id}/handle`, params);
      message.success('延时申请已拒绝');
      setHandleExtensionModalOpen(false);
      setSelectedExtensionRequest(null);
      handleExtensionForm.resetFields();
      fetchExtensionRequests();
      fetchBookings();
    } catch {}
  };

  const handleEndVisitorAccess = async (request: MeetingExtensionRequest) => {
    try {
      await api.patch(`/meeting-bookings/${request.bookingId}`, { status: 'completed' });
      message.success('访客权限已结束');
      fetchExtensionRequests();
      fetchBookings();
      fetchRooms();
    } catch {}
  };

  const handleConflictAlert = async (alertId: number) => {
    try {
      await api.patch(`/alerts/${alertId}/handle`, { handledBy: '会议室管理员' });
      message.success('冲突告警已处理');
      fetchConflictAlerts();
    } catch {}
  };

  const unhandledConflicts = conflictAlerts.filter((a) => !a.handled);

  const extensionRequestColumns = [
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    {
      title: '原结束时间',
      dataIndex: 'originalEndTime',
      key: 'originalEndTime',
      render: (val: string) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '申请延时至',
      dataIndex: 'requestedEndTime',
      key: 'requestedEndTime',
      render: (val: string) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '冲突',
      dataIndex: 'hasConflict',
      key: 'hasConflict',
      render: (val: boolean) =>
        val ? <Tag color="red">有冲突</Tag> : <Tag color="green">无冲突</Tag>,
    },
    {
      title: '建议会议室',
      dataIndex: 'suggestedRoomName',
      key: 'suggestedRoomName',
      render: (val: string | null) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = { pending: 'blue', approved: 'green', rejected: 'red' };
        const labelMap: Record<string, string> = { pending: '待审批', approved: '已批准', rejected: '已拒绝' };
        return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MeetingExtensionRequest) => (
        <Space>
          {record.hasConflict && record.suggestedRoomId && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => handleApproveExtension(record, true, record.suggestedRoomId!)}
              >
                换会议室批准
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleEndVisitorAccess(record)}
              >
                结束访客权限
              </Button>
            </>
          )}
          {record.hasConflict && !record.suggestedRoomId && (
            <Button
              size="small"
              danger
              onClick={() => handleEndVisitorAccess(record)}
            >
              结束访客权限
            </Button>
          )}
          {!record.hasConflict && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleApproveExtension(record, false)}
            >
              批准
            </Button>
          )}
          <Button
            size="small"
            danger
            onClick={() => {
              setSelectedExtensionRequest(record);
              setHandleExtensionModalOpen(true);
            }}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

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
      title: '延时',
      dataIndex: 'extended',
      key: 'extended',
      render: (val: boolean, record: MeetingBooking) =>
        val ? (
          <Tag color="orange">
            延至 {dayjs(record.endTime).format('HH:mm')}
          </Tag>
        ) : '-',
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
              onClick={() => openRequestExtensionModal(record)}
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
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            会议室冲突预警
            {unhandledConflicts.length > 0 && (
              <Badge count={unhandledConflicts.length} style={{ marginLeft: 8 }} />
            )}
          </Space>
        }
        size="small"
      >
        {conflictAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            暂无冲突预警
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {conflictAlerts.map((alertItem) => (
              <Col span={12} key={alertItem.id}>
                <Card
                  size="small"
                  style={{
                    borderLeft: `3px solid ${alertItem.handled ? '#d9d9d9' : '#ff4d4f'}`,
                    opacity: alertItem.handled ? 0.6 : 1,
                  }}
                >
                  <Space align="start" style={{ width: '100%' }}>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Space>
                          <Tag color="red">预约冲突</Tag>
                          <Tag color="orange">中</Tag>
                        </Space>
                      </div>
                      <div style={{ marginBottom: 4, color: '#333' }}>{alertItem.message}</div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                        {dayjs(alertItem.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        {alertItem.visitorName && ` | 访客: ${alertItem.visitorName}`}
                      </div>
                      <div>
                        {alertItem.handled ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            已处理 by {alertItem.handledBy}
                          </Tag>
                        ) : (
                          <Space>
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => handleConflictAlert(alertItem.id)}
                            >
                              处理冲突
                            </Button>
                          </Space>
                        )}
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            会议延时审批
            {extensionRequests.length > 0 && (
              <Badge count={extensionRequests.length} style={{ marginLeft: 8 }} />
            )}
          </Space>
        }
        size="small"
      >
        {extensionRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            暂无待审批的延时申请
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={extensionRequestColumns}
            dataSource={extensionRequests}
            loading={extensionRequestsLoading}
            pagination={false}
            size="small"
          />
        )}
      </Card>

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

      <Modal
        title="申请延时"
        open={requestExtensionModalOpen}
        onCancel={() => {
          setRequestExtensionModalOpen(false);
          setExtendingBooking(null);
          requestExtensionForm.resetFields();
        }}
        onOk={() => requestExtensionForm.submit()}
      >
        {extendingBooking && (
          <div style={{ marginBottom: 16, color: '#666' }}>
            当前预约: {getRoomName(extendingBooking.meetingRoomId)}，结束时间: {dayjs(extendingBooking.endTime).format('YYYY-MM-DD HH:mm')}
          </div>
        )}
        <Form form={requestExtensionForm} layout="vertical" onFinish={handleRequestExtension}>
          <Form.Item name="newEndTime" label="新结束时间" rules={[{ required: true, message: '请选择新的结束时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="申请人">
            <Input value="会议室管理员" disabled />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝延时申请"
        open={handleExtensionModalOpen}
        onCancel={() => {
          setHandleExtensionModalOpen(false);
          setSelectedExtensionRequest(null);
          handleExtensionForm.resetFields();
        }}
        onOk={() => handleExtensionForm.submit()}
      >
        {selectedExtensionRequest && (
          <div style={{ marginBottom: 16, color: '#666' }}>
            访客: {selectedExtensionRequest.visitorName}，申请延时至: {dayjs(selectedExtensionRequest.requestedEndTime).format('YYYY-MM-DD HH:mm')}
          </div>
        )}
        <Form form={handleExtensionForm} layout="vertical" onFinish={handleRejectExtension}>
          <Form.Item name="rejectedReason" label="拒绝原因" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <TextArea rows={3} placeholder="请输入拒绝原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MeetingAdminPage;
