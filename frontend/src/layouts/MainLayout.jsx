import React, { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Progress } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  PictureOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  StarOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../stores/auth'
import { historyApi } from '../lib/api'

const { Sider, Header, Content } = Layout
const { Text } = Typography

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [quota, setQuota] = useState({ used: 0, daily: 10, remaining: 10 })
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const isAdmin = useAuthStore((state) => state.isAdmin)()

  useEffect(() => {
    fetchQuota()
  }, [location.pathname])

  const fetchQuota = async () => {
    try {
      const response = await historyApi.getStats()
      const data = response.data
      setQuota({
        used: data.quota_used,
        daily: data.quota_daily,
        remaining: data.quota_remaining
      })
    } catch (error) {
      console.error('Failed to fetch quota:', error)
    }
  }

  const menuItems = [
    {
      key: 'generate',
      icon: <AppstoreOutlined />,
      label: 'AI 生图',
      children: [
        {
          key: '/generate/text',
          icon: <PictureOutlined />,
          label: '文生图'
        },
        {
          key: '/generate/image',
          icon: <PictureOutlined />,
          label: '图生图'
        }
      ]
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: '历史记录'
    },
    {
      key: '/upgrade',
      icon: <CrownOutlined style={{ color: '#FFD700' }} />,
      label: (
        <span>
          提升额度
          <span style={{ marginLeft: 4, color: '#FFD700', fontSize: 12 }}>✦</span>
        </span>
      )
    },
    ...(isAdmin ? [{
      key: '/admin',
      icon: <TeamOutlined />,
      label: '账号管理'
    }] : [])
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true
    }
  ]

  const handleMenuClick = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key)
    }
  }

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    } else if (key === 'profile') {
      navigate('/profile')
    }
  }

  const getSelectedKey = () => {
    return location.pathname
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0F0F0F' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
        style={{
          background: '#1A1A1A',
          borderRight: '1px solid #333'
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #333'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <StarOutlined style={{ fontSize: 18, color: '#fff' }} />
            </div>
            {!collapsed && (
              <Text strong style={{ color: '#fff', fontSize: 18 }}>
                ArtFlow
              </Text>
            )}
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          defaultOpenKeys={['generate']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            background: '#1A1A1A',
            borderRight: 0,
            paddingTop: 16
          }}
        />

        {!collapsed && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              borderTop: '1px solid #333',
              background: '#1A1A1A'
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                今日额度
              </Text>
            </div>
            <Progress
              percent={(quota.used / quota.daily) * 100}
              showInfo={false}
              strokeColor={{ from: '#7C3AED', to: '#4F46E5' }}
              trailColor="rgba(255,255,255,0.1)"
              size="small"
            />
            <div style={{ marginTop: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {quota.used} / {quota.daily} 剩余 {quota.remaining}
              </Text>
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#1A1A1A',
            borderBottom: '1px solid #333',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <Text strong style={{ color: '#fff', display: 'block' }}>
                  {user?.nickname || user?.email}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                  {user?.is_admin ? '管理员' : '普通用户'}
                </Text>
              </div>
              <Avatar
                size={40}
                src={user?.avatar_url}
                icon={<UserOutlined />}
                style={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)' }}
              />
            </div>
          </Dropdown>
        </Header>

        <Content
          style={{
            padding: 24,
            background: '#0F0F0F',
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
