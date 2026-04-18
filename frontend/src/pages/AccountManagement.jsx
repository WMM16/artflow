import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Typography,
  Tag,
  Space,
  Button,
  Switch,
  Input,
  message,
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  Statistic,
  Progress,
  Tooltip,
  Popconfirm
} from 'antd'
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { subAccountApi } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const { Title, Text } = Typography

function AccountManagement() {
  const [subAccounts, setSubAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [editingAccount, setEditingAccount] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [stats, setStats] = useState({
    total_subaccounts: 0,
    active_subaccounts: 0,
    inactive_subaccounts: 0,
    total_quota_used: 0,
    total_quota_allocated: 0,
    available_quota: 0
  })
  const [form] = Form.useForm()
  const [createForm] = Form.useForm()

  const currentUser = useAuthStore((state) => state.user)
  const userQuota = currentUser?.quota_daily || 0

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [accountsRes, statsRes] = await Promise.all([
        subAccountApi.getList(),
        subAccountApi.getStats()
      ])
      setSubAccounts(accountsRes.data || [])
      setStats(statsRes.data || {})
    } catch (error) {
      message.error('获取子账号数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (values) => {
    try {
      await subAccountApi.create({
        email: values.email,
        nickname: values.nickname,
        password: values.password,
        quota_daily: values.quota_daily
      })
      message.success('子账号创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.detail || '创建失败')
    }
  }

  const handleUpdateAccount = async (values) => {
    try {
      const updateData = {
        nickname: values.nickname,
        is_active: values.is_active,
        quota_daily: values.quota_daily
      }
      if (values.password) {
        updateData.password = values.password
      }

      await subAccountApi.update(editingAccount.id, updateData)
      message.success('更新成功')
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.detail || '更新失败')
    }
  }

  const handleDeleteAccount = async (id) => {
    try {
      await subAccountApi.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.detail || '删除失败')
    }
  }

  const openEditModal = (account) => {
    setEditingAccount(account)
    form.setFieldsValue({
      nickname: account.nickname,
      email: account.email,
      is_active: account.is_active,
      quota_daily: account.quota_daily
    })
    setModalVisible(true)
  }

  const openCreateModal = () => {
    createForm.resetFields()
    createForm.setFieldsValue({
      quota_daily: 10
    })
    setCreateModalVisible(true)
  }

  const filteredAccounts = subAccounts.filter(account =>
    account.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    (account.nickname && account.nickname.toLowerCase().includes(searchText.toLowerCase()))
  )

  const columns = [
    {
      title: '账号信息',
      dataIndex: 'email',
      key: 'user',
      render: (_, record) => (
        <Space>
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
            <UserOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 13 }}>
              {record.nickname || '未设置昵称'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              {record.email}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'status',
      width: 80,
      render: (isActive) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isActive ? 'success' : 'error'}
          style={{ border: 'none', fontSize: 11 }}
        >
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '配额使用',
      key: 'quota',
      width: 140,
      render: (_, record) => (
        <div style={{ width: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              {record.quota_used} / {record.quota_daily}
            </Text>
          </div>
          <Progress
            percent={record.quota_daily > 0 ? (record.quota_used / record.quota_daily) * 100 : 0}
            showInfo={false}
            strokeColor={{ from: '#7C3AED', to: '#4F46E5' }}
            trailColor="rgba(255,255,255,0.1)"
            size="small"
          />
        </div>
      )
    },
    {
      title: '下级账号',
      dataIndex: 'children_count',
      key: 'children',
      width: 80,
      render: (count) => (
        <Tag color={count > 0 ? 'processing' : 'default'} style={{ border: 'none', fontSize: 11 }}>
          {count} 个
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (date) => (
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
          {new Date(date).toLocaleDateString('zh-CN')}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(record)}
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              border: 'none'
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除子账号 "${record.nickname || record.email}" 吗？`}
            onConfirm={() => handleDeleteAccount(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4} style={{ color: '#fff', marginBottom: 12, marginTop: 0, flexShrink: 0 }}>
        <TeamOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        账户管理
      </Title>

      {/* 统计卡片 */}
      <Row gutter={12} style={{ marginBottom: 12, flexShrink: 0 }}>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 8
            }}
            bodyStyle={{ padding: 12 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>子账号总数</span>}
              value={stats.total_subaccounts}
              prefix={<TeamOutlined style={{ color: '#7C3AED', fontSize: 16 }} />}
              valueStyle={{ color: '#fff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 8
            }}
            bodyStyle={{ padding: 12 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>活跃账号</span>}
              value={stats.active_subaccounts}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />}
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 8
            }}
            bodyStyle={{ padding: 12 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>已分配额度</span>}
              value={stats.total_quota_allocated}
              suffix={`/ ${userQuota}`}
              prefix={<InfoCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />}
              valueStyle={{ color: '#faad14', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 8
            }}
            bodyStyle={{ padding: 12 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>可用额度</span>}
              value={stats.available_quota}
              prefix={<PlusOutlined style={{ color: '#52c41a', fontSize: 16 }} />}
              valueStyle={{ color: '#52c41a', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 额度使用进度 */}
      <Card
        style={{
          background: '#1A1A1A',
          border: '1px solid #333',
          borderRadius: 8,
          marginBottom: 12,
          flexShrink: 0
        }}
        bodyStyle={{ padding: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: '#fff', fontSize: 13 }}>额度分配情况</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                已分配 {stats.total_quota_allocated} / 总额度 {userQuota}
              </Text>
            </div>
            <Progress
              percent={userQuota > 0 ? (stats.total_quota_allocated / userQuota) * 100 : 0}
              strokeColor={{ from: '#7C3AED', to: '#4F46E5' }}
              trailColor="rgba(255,255,255,0.1)"
              size="small"
              format={(percent) => <span style={{ color: '#fff', fontSize: 12 }}>{percent?.toFixed(0)}%</span>}
            />
          </div>
        </div>
      </Card>

      {/* 子账号列表 */}
      <Card
        style={{
          background: '#1A1A1A',
          border: '1px solid #333',
          borderRadius: 8,
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
          <Input
            placeholder="搜索子账号邮箱或昵称"
            prefix={<SearchOutlined style={{ color: '#7C3AED' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 240,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #333',
              color: '#fff'
            }}
            size="small"
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              size="small"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #333', color: '#fff' }}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={openCreateModal}
              disabled={stats.available_quota <= 0}
              size="small"
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                border: 'none'
              }}
            >
              新建子账号
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredAccounts}
          loading={loading}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            style: { color: 'rgba(255,255,255,0.7)' }
          }}
          style={{ background: 'transparent', flex: 1 }}
          scroll={{ y: 'calc(100vh - 420px)' }}
        />
      </Card>

      {/* 创建子账号弹窗 */}
      <Modal
        title={<span style={{ color: '#fff' }}>新建子账号</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
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
          form={createForm}
          layout="vertical"
          onFinish={handleCreateAccount}
        >
          <Form.Item
            name="email"
            label={<span style={{ color: '#fff' }}>邮箱</span>}
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              placeholder="请输入子账号邮箱"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: '#fff'
              }}
            />
          </Form.Item>

          <Form.Item
            name="nickname"
            label={<span style={{ color: '#fff' }}>昵称</span>}
          >
            <Input
              placeholder="请输入昵称（可选）"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: '#fff'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#fff' }}>密码</span>}
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              placeholder="请设置登录密码"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: '#fff'
              }}
            />
          </Form.Item>

          <Form.Item
            name="quota_daily"
            label={
              <span style={{ color: '#fff' }}>
                每日配额
                <Tooltip title={`可用额度: ${stats.available_quota}`}>
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#7C3AED' }} />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请输入每日配额' }]}
          >
            <InputNumber
              min={1}
              max={stats.available_quota}
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
                创建
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑子账号弹窗 */}
      <Modal
        title={<span style={{ color: '#fff' }}>编辑子账号</span>}
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
          onFinish={handleUpdateAccount}
        >
          <Form.Item
            name="email"
            label={<span style={{ color: '#fff' }}>邮箱</span>}
          >
            <Input
              disabled
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: 'rgba(255,255,255,0.5)'
              }}
            />
          </Form.Item>

          <Form.Item
            name="nickname"
            label={<span style={{ color: '#fff' }}>昵称</span>}
          >
            <Input
              placeholder="请输入昵称"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: '#fff'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <span style={{ color: '#fff' }}>
                新密码
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginLeft: 4 }}>
                  (留空表示不修改)
                </span>
              </span>
            }
          >
            <Input.Password
              placeholder="请输入新密码"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid #333',
                color: '#fff'
              }}
            />
          </Form.Item>

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
            label={
              <span style={{ color: '#fff' }}>
                每日配额
                <Tooltip title={`当前可用额度: ${stats.available_quota + (editingAccount?.quota_daily || 0)}`}>
                  <InfoCircleOutlined style={{ marginLeft: 4, color: '#7C3AED' }} />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请输入每日配额' }]}
          >
            <InputNumber
              min={1}
              max={stats.available_quota + (editingAccount?.quota_daily || 0)}
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

export default AccountManagement
