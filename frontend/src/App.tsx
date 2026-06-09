import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, theme, Badge } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  SolutionOutlined,
  SafetyOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import DashboardPage from './pages/DashboardPage';
import FrontDeskPage from './pages/FrontDeskPage';
import EmployeePage from './pages/EmployeePage';
import SecurityPage from './pages/SecurityPage';
import MeetingAdminPage from './pages/MeetingAdminPage';

const { Sider, Content } = Layout;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: '/front-desk',
    icon: <SolutionOutlined />,
    label: '前台接待',
  },
  {
    key: '/employee',
    icon: <UserOutlined />,
    label: '被访员工',
  },
  {
    key: '/security',
    icon: <SafetyOutlined />,
    label: '安保管理',
  },
  {
    key: '/meeting-admin',
    icon: <TeamOutlined />,
    label: '会议室管理',
  },
];

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            background: 'linear-gradient(180deg, #001529 0%, #003a70 100%)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              height: 56,
              margin: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: collapsed ? 16 : 20,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              letterSpacing: 2,
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              paddingBottom: 12,
            }}
          >
            {collapsed ? '访客' : '访客接待平台'}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname === '/' ? '/dashboard' : location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          />
        </Sider>
        <Layout>
          <Content
            style={{
              margin: 16,
              padding: 24,
              background: '#f5f5f5',
              borderRadius: 8,
              overflow: 'auto',
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/front-desk" element={<FrontDeskPage />} />
              <Route path="/employee" element={<EmployeePage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/meeting-admin" element={<MeetingAdminPage />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
