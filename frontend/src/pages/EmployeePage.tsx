import { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Switch, DatePicker, Button, Table, Tag, Space, Modal, Descriptions, Alert, message } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/index';
import type { Appointment, CreateAppointmentParams, Companion, MeetingExtensionRequest, ConfirmVisitorStayParams } from '../types/index';

const { TextArea } = Input;

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已拒绝' },
  cancelled: { color: 'gray', label: '已取消' },
};

const companionStatusMap: Record<string, { color: string; label: string }> = {
  pending_confirmation: { color: 'orange', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已拒绝' },
};

const idTypeOptions = [
  { label: '身份证', value: 'id_card' },
  { label: '护照', value: 'passport' },
  { label: '驾照', value: 'driver_license' },
  { label: '其他', value: 'other' },
];

function EmployeePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [companionsLoading, setCompanionsLoading] = useState(false);
  const [companionDetailOpen, setCompanionDetailOpen] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [pendingExtensions, setPendingExtensions] = useState<MeetingExtensionRequest[]>([]);
  const [extensionsLoading, setExtensionsLoading] = useState(false);
  const [confirmStayModalOpen, setConfirmStayModalOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<MeetingExtensionRequest | null>(null);
  const [form] = Form.useForm();
  const [confirmStayForm] = Form.useForm();

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

  const fetchPendingCompanions = useCallback(async () => {
    setCompanionsLoading(true);
    try {
      const res: any = await api.get('/companions', { params: { status: 'pending_confirmation' } });
      setCompanions(Array.isArray(res) ? res : []);
    } catch {
      setCompanions([]);
    } finally {
      setCompanionsLoading(false);
    }
  }, []);

  const fetchPendingExtensions = useCallback(async () => {
    setExtensionsLoading(true);
    try {
      const res: any = await api.get('/meeting-extension-requests', { params: { status: 'pending' } });
      setPendingExtensions(Array.isArray(res) ? res : []);
    } catch {
      setPendingExtensions([]);
    } finally {
      setExtensionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchPendingCompanions();
    fetchPendingExtensions();
  }, [fetchAppointments, fetchPendingCompanions, fetchPendingExtensions]);

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

  const handleConfirmCompanion = async (companion: Companion) => {
    try {
      await api.patch(`/companions/${companion.id}/confirm`, {
        confirmedBy: '李明',
      });
      message.success(`已确认随行人员 ${companion.name}，已开通其申请楼层的通行权限`);
      fetchPendingCompanions();
    } catch {}
  };

  const handleRejectCompanion = async (companion: Companion) => {
    try {
      await api.patch(`/companions/${companion.id}/reject`, {
        rejectedBy: '李明',
      });
      message.success(`已拒绝随行人员 ${companion.name}，其通行权限已撤销`);
      fetchPendingCompanions();
    } catch {}
  };

  const handleViewCompanionDetail = (companion: Companion) => {
    setSelectedCompanion(companion);
    setCompanionDetailOpen(true);
  };

  const handleConfirmVisitorStay = async (extension: MeetingExtensionRequest) => {
    try {
      const params: ConfirmVisitorStayParams = {
        confirmed: true,
        confirmedBy: '李明',
      };
      await api.post(`/meeting-extension-requests/${extension.id}/confirm-stay`, params);
      message.success(`已确认访客 ${extension.visitorName} 继续停留`);
      setConfirmStayModalOpen(false);
      setSelectedExtension(null);
      confirmStayForm.resetFields();
      fetchPendingExtensions();
    } catch {}
  };

  const handleRejectVisitorStay = async (extension: MeetingExtensionRequest, reason: string) => {
    try {
      const params: ConfirmVisitorStayParams = {
        confirmed: false,
        confirmedBy: '李明',
        note: reason,
      };
      await api.post(`/meeting-extension-requests/${extension.id}/confirm-stay`, params);
      message.success(`已拒绝访客 ${extension.visitorName} 继续停留`);
      setConfirmStayModalOpen(false);
      setSelectedExtension(null);
      confirmStayForm.resetFields();
      fetchPendingExtensions();
    } catch {}
  };

  const handleOpenConfirmStay = (extension: MeetingExtensionRequest) => {
    setSelectedExtension(extension);
    setConfirmStayModalOpen(true);
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
    { title: '与主访客关系', dataIndex: 'relationship', key: 'relationship' },
    {
      title: '申请通行楼层',
      dataIndex: 'allowedFloors',
      key: 'allowedFloors',
      render: (floors: string) =>
        floors?.split(',').map((f) => <Tag color="blue" key={f}>{f}</Tag>),
    },
    {
      title: '当前权限',
      key: 'currentAccess',
      render: (_: any, record: Companion) => (
        <Tag color="orange">仅前台等候区(1F)</Tag>
      ),
    },
    {
      title: '登记时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Companion) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleViewCompanionDetail(record)}
          >
            详情
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleConfirmCompanion(record)}
          >
            确认
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleRejectCompanion(record)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  const extensionColumns = [
    { title: '访客姓名', dataIndex: 'visitorName', key: 'visitorName' },
    {
      title: '原结束时间',
      dataIndex: 'originalEndTime',
      key: 'originalEndTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '申请结束时间',
      dataIndex: 'requestedEndTime',
      key: 'requestedEndTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '冲突',
      dataIndex: 'hasConflict',
      key: 'hasConflict',
      render: (val: boolean) =>
        val ? <Tag color="red">有冲突</Tag> : <Tag color="green">无冲突</Tag>,
    },
    {
      title: '建议换至',
      dataIndex: 'suggestedRoomName',
      key: 'suggestedRoomName',
      render: (val: string | null) => val || '-',
    },
    {
      title: '申请人',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      render: (val: string | null) => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MeetingExtensionRequest) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            icon={<CheckOutlined />}
            onClick={() => handleConfirmVisitorStay(record)}
          >
            确认继续停留
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleOpenConfirmStay(record)}
          >
            拒绝停留
          </Button>
        </Space>
      ),
    },
  ];

  const unconfirmedExtensions = pendingExtensions.filter((e) => !e.employeeConfirmed);

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

      <Card
        title={
          <Space>
            <TeamOutlined />
            待确认随行人员
            {companions.length > 0 && <Tag color="orange">{companions.length}</Tag>}
          </Space>
        }
        size="small"
      >
        {companions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            暂无待确认的随行人员
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={companionColumns}
            dataSource={companions}
            loading={companionsLoading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Card>

      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            会议延时确认
            {unconfirmedExtensions.length > 0 && <Tag color="orange">{unconfirmedExtensions.length}</Tag>}
          </Space>
        }
        size="small"
      >
        {unconfirmedExtensions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
            暂无待确认的会议延时请求
          </div>
        ) : (
          <Table
            rowKey="id"
            columns={extensionColumns}
            dataSource={unconfirmedExtensions}
            loading={extensionsLoading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Card>

      <Modal
        title="随行人员详情"
        open={companionDetailOpen}
        onCancel={() => {
          setCompanionDetailOpen(false);
          setSelectedCompanion(null);
        }}
        footer={[
          <Button key="reject" danger icon={<CloseOutlined />} onClick={() => {
            if (selectedCompanion) {
              handleRejectCompanion(selectedCompanion);
              setCompanionDetailOpen(false);
              setSelectedCompanion(null);
            }
          }}>
            拒绝
          </Button>,
          <Button key="confirm" type="primary" icon={<CheckOutlined />} onClick={() => {
            if (selectedCompanion) {
              handleConfirmCompanion(selectedCompanion);
              setCompanionDetailOpen(false);
              setSelectedCompanion(null);
            }
          }}>
            确认通行
          </Button>,
        ]}
        width={480}
      >
        {selectedCompanion && (
          <div>
            <Alert
              message="确认前，该随行人员仅限前台等候区(1F)通行，不可继承主访客权限"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="姓名">{selectedCompanion.name}</Descriptions.Item>
              <Descriptions.Item label="证件类型">
                {idTypeOptions.find((o) => o.value === selectedCompanion.idType)?.label || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="证件号码">{selectedCompanion.idNumber || '-'}</Descriptions.Item>
              <Descriptions.Item label="与主访客关系">{selectedCompanion.relationship}</Descriptions.Item>
              <Descriptions.Item label="申请通行楼层">
                {selectedCompanion.allowedFloors?.split(',').map((f) => (
                  <Tag color="blue" key={f}>{f}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="当前权限">
                <Tag color="orange">仅前台等候区(1F)</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="登记时间">
                {dayjs(selectedCompanion.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>
              确认后，该随行人员将获得申请楼层的通行权限；拒绝后，其门禁权限将被撤销。
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="确认访客继续停留"
        open={confirmStayModalOpen}
        onCancel={() => {
          setConfirmStayModalOpen(false);
          setSelectedExtension(null);
          confirmStayForm.resetFields();
        }}
        footer={[
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              confirmStayForm.validateFields().then((values) => {
                if (selectedExtension) {
                  handleRejectVisitorStay(selectedExtension, values.reason);
                }
              });
            }}
          >
            拒绝
          </Button>,
          <Button
            key="confirm"
            type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            icon={<CheckOutlined />}
            onClick={() => {
              if (selectedExtension) {
                handleConfirmVisitorStay(selectedExtension);
              }
            }}
          >
            确认继续停留
          </Button>,
        ]}
        width={520}
      >
        {selectedExtension && (
          <div>
            {selectedExtension.hasConflict && (
              <Alert
                message="时间冲突警告"
                description={
                  <span>
                    该延时请求与后续会议存在时间冲突
                    {selectedExtension.suggestedRoomName && (
                      <>，建议更换至 <strong>{selectedExtension.suggestedRoomName}</strong></>
                    )}
                  </span>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="访客姓名">{selectedExtension.visitorName}</Descriptions.Item>
              <Descriptions.Item label="当前结束时间">
                {dayjs(selectedExtension.originalEndTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="申请结束时间">
                {dayjs(selectedExtension.requestedEndTime).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            <Form form={confirmStayForm} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item name="reason" label="拒绝原因（拒绝时必填）" rules={[{ required: false }]}>
                <TextArea rows={3} placeholder="请输入拒绝原因" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default EmployeePage;
