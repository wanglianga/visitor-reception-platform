import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Spin } from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/index';
import AlertPanel from '../components/AlertPanel';
import type { DashboardStats, Appointment, Visitor, Alert as AlertType } from '../types/index';

const appointmentStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'blue', label: '待确认' },
  confirmed: { color: 'green', label: '已确认' },
  rejected: { color: 'red', label: '已拒绝' },
  cancelled: { color: 'gray', label: '已取消' },
};

const visitorStatusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: '待登记' },
  registered: { color: 'blue', label: '已登记' },
  in_building: { color: 'green', label: '在楼内' },
  left: { color: 'gray', label: '已离开' },
  rejected: { color: 'red', label: '已拒绝' },
};

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/dashboard/stats');
      setStats(res);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const res: any = await api.get('/dashboard/recent-activity');
      setRecentAppointments(res?.recentAppointments || []);
      setRecentVisitors(res?.recentVisitors || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentActivity();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchRecentActivity]);

  const appointmentColumns = [
    { title: '访客', dataIndex: 'visitorName', key: 'visitorName' },
    { title: '公司', dataIndex: 'visitorCompany', key: 'visitorCompany', ellipsis: true },
    { title: '事由', dataIndex: 'purpose', key: 'purpose', ellipsis: true },
    {
      title: '预计时间',
      dataIndex: 'expectedTime',
      key: 'expectedTime',
      render: (val: string) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
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
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '公司', dataIndex: 'company', key: 'company', ellipsis: true },
    {
      title: '随行',
      dataIndex: 'accompanyCount',
      key: 'accompanyCount',
      render: (val: number) => val > 0 ? <Tag color="blue">{val}人</Tag> : '-',
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
      title: '登记时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="待处理预约"
              value={stats?.pendingAppointments || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="在楼访客"
              value={stats?.inBuildingVisitors || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="有效门禁权限"
              value={stats?.activePermissions || 0}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="未处理告警"
              value={stats?.unhandledAlerts || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: stats?.unhandledAlerts ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="总预约数"
              value={stats?.totalAppointments || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" hoverable>
            <Statistic
              title="总访客数"
              value={stats?.totalVisitors || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={12} />
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近预约" size="small">
            <Table
              rowKey="id"
              columns={appointmentColumns}
              dataSource={recentAppointments}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近登记访客" size="small">
            <Table
              rowKey="id"
              columns={visitorColumns}
              dataSource={recentVisitors}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <AlertPanel />
    </div>
  );
}

export default DashboardPage;
