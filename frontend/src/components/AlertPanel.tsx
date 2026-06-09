import { useState, useEffect, useCallback } from 'react';
import { Card, Tag, Badge, Button, Row, Col, Space, Empty, message } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/index';
import type { Alert as AlertType } from '../types/index';

const typeConfig: Record<string, { color: string; label: string }> = {
  id_mismatch: { color: 'gold', label: '证件不符' },
  temporary_visitor: { color: 'orange', label: '临时访客' },
  timeout: { color: 'default', label: '超时' },
  meeting_conflict: { color: 'red', label: '预约冲突' },
  overstay: { color: 'orange', label: '超时滞留' },
};

const severityConfig: Record<string, { color: 'blue' | 'green' | 'orange' | 'red'; label: string }> = {
  low: { color: 'blue', label: '低' },
  medium: { color: 'orange', label: '中' },
  high: { color: 'red', label: '高' },
};

function AlertPanel() {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/alerts');
      setAlerts(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleAlert = async (id: number) => {
    try {
      await api.patch(`/alerts/${id}/handle`, { handledBy: '系统操作员' });
      message.success('预警已处理');
      fetchAlerts();
    } catch {}
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />;
      case 'medium':
        return <WarningOutlined style={{ color: '#fa8c16', fontSize: 20 }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#1677ff', fontSize: 20 }} />;
    }
  };

  const unhandledCount = alerts.filter((a) => !a.handled).length;

  return (
    <Card
      title={
        <Space>
          <ExclamationCircleOutlined />
          预警通知
          {unhandledCount > 0 && (
            <Badge count={unhandledCount} style={{ marginLeft: 8 }} />
          )}
        </Space>
      }
      size="small"
    >
      {alerts.length === 0 ? (
        <Empty description="暂无预警" />
      ) : (
        <Row gutter={[12, 12]}>
          {alerts.map((alert) => {
            const typeInfo = typeConfig[alert.type] || { color: 'default', label: alert.type };
            const sevInfo = severityConfig[alert.severity] || { color: 'blue', label: alert.severity };
            return (
              <Col span={12} key={alert.id}>
                <Card
                  size="small"
                  style={{
                    borderLeft: `3px solid ${alert.handled ? '#d9d9d9' : typeInfo.color === 'red' ? '#ff4d4f' : typeInfo.color === 'orange' ? '#fa8c16' : '#1677ff'}`,
                    opacity: alert.handled ? 0.6 : 1,
                  }}
                >
                  <Space align="start" style={{ width: '100%' }}>
                    {getSeverityIcon(alert.severity)}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Space>
                          <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                          <Badge
                            status={sevInfo.color === 'red' ? 'error' : sevInfo.color === 'orange' ? 'warning' : 'processing'}
                            text={sevInfo.label}
                          />
                        </Space>
                      </div>
                      <div style={{ marginBottom: 4, color: '#333' }}>{alert.message}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {dayjs(alert.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {alert.handled ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            已处理
                          </Tag>
                        ) : (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => handleAlert(alert.id)}
                          >
                            处理
                          </Button>
                        )}
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Card>
  );
}

export default AlertPanel;
