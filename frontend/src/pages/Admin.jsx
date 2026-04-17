import React, { useState, useEffect } from 'react'
import { Card, Table, Typography, Tag, Space, Button, Switch, Input, message, Modal, Form, InputNumber } from 'antd'
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  EditOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { userApi } from '../lib/api'

const { Title, Text } = Typography

function Admin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await userApi.listUsers()
      setUsers(response.data)
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (values) => {
    try {
      await userApi.updateUser(editingUser.id, {
        is_active: values.is_active,
        quota_daily: values.quota_daily
      })
      message.success('更新成功')
      setModalVisible(false)
      fetchUsers()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    form.setFieldsValue({
      is_active: user.is_active,
      quota_daily: user.quota_daily
    })
    setModalVisible(true)
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.nickname && user.nickname.toLowerCase().includes(searchText.toLowerCase()))
  )

  const columns = [
    {
      title: '用户信息',
      dataIndex: 'email',
      key: 'user',
      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UserOutlined style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ color: '#fff' }}>
              {record.nickname || '未设置昵称'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              {record.email}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'is_admin',
      key: 'role',
      render: (isAdmin) => (
        <Tag
          icon={isAdmin ? <CrownOutlined /> : <UserOutlined />}
          color={isAdmin ? 'gold' : 'default'}
          style={{ border: 'none' }}
        >
          {isAdmin ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'status',
      render: (isActive) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isActive ? 'success' : 'error'}
          style={{ border: 'none' }}
        >
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '配额',
      key: 'quota',
      render: (_, record) => (
        <div>
          <div style={{ color: '#fff' }}>
            {record.quota_used} / {record.quota_daily}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            剩余 {Math.max(0, record.quota_daily - record.quota_used)}
          </div>
        </div>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>
          {new Date(date).toLocaleDateString('zh-CN')}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => openEditModal(record)}
          disabled={record.is_admin}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            border: 'none'
          }}
        >
          编辑
        </Button>
      )
    }
  ]

  return (
    <div>
      <Title level={3} style={{ color: '#fff', marginBottom: 24 }}>
        <TeamOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        账号管理
      </Title>

      <Card
        style={{
          background: '#1A1A1A',
          border: '1px solid #333',
          borderRadius: 12
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索用户邮箱或昵称"
            prefix={<SearchOutlined style={{ color: '#7C3AED' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 300,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #333',
              color: '#fff'
            }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          style={{
            background: 'transparent'
          }}
        />
      </Card>

      <Modal
        title={<span style={{ color: '#fff' }}>编辑用户</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        style={{ top: 20 }}
        styles={{
          content: {
            background: '#1A1A1A',
            border: '1px solid #333'
          },
          header: {
            background: '#1A1A1A',
            borderBottom: '1px solid #333'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            name="is_active"
            label={<span style={{ color: '#fff' }}>账号状态</span>}
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>

          <Form.Item
            name="quota_daily"
            label={<span style={{ color: '#fff' }}>每日配额</span>}
            rules={[{ required: true, message: '请输入每日配额' }]}
          >
            <InputNumber
              min={1}
              max={1000}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: '#fff'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  border: 'none'
                }}
              >
                保存
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Admin
