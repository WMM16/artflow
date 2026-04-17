import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Avatar, Form, Input, Button, Upload, Statistic, Divider, message, Tabs } from 'antd'
import {
  UserOutlined,
  MailOutlined,
  EditOutlined,
  LockOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../stores/auth'
import { userApi, historyApi } from '../lib/api'

const { Title, Text } = Typography
const { TabPane } = Tabs

function Profile() {
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    today: 0
  })
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await historyApi.getStats()
      setStats({
        total: response.data.total,
        completed: response.data.completed,
        today: response.data.today
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleUpdateProfile = async (values) => {
    setLoading(true)
    try {
      const response = await userApi.updateMe({
        nickname: values.nickname
      })
      setUser(response.data)
      message.success('更新成功')
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values) => {
    setPasswordLoading(true)
    try {
      await userApi.changePassword(values.oldPassword, values.newPassword)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error(error.response?.data?.detail || '密码修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleUploadAvatar = async ({ file }) => {
    try {
      const response = await userApi.uploadAvatar(file)
      setUser({ ...user, avatar_url: response.data.avatar_url })
      message.success('头像上传成功')
    } catch (error) {
      message.error('头像上传失败')
    }
    return false
  }

  return (
    <div>
      <Title level={3} style={{ color: '#fff', marginBottom: 24 }}>
        <UserOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        个人中心
      </Title>

      <Row gutter={24}>
        <Col span={8}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 12,
              textAlign: 'center'
            }}
          >
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleUploadAvatar}
            >
              <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
                <Avatar
                  size={120}
                  src={user?.avatar_url}
                  icon={<UserOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    fontSize: 48
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UploadOutlined style={{ color: '#fff' }} />
                </div>
              </div>
            </Upload>

            <Title level={4} style={{ color: '#fff', marginTop: 16, marginBottom: 4 }}>
              {user?.nickname || '未设置昵称'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
              <MailOutlined style={{ marginRight: 8 }} />
              {user?.email}
            </Text>

            <Divider style={{ borderColor: '#333' }} />

            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>总生成</span>}
                  value={stats.total}
                  valueStyle={{ color: '#7C3AED', fontSize: 24 }}
                  prefix={<HistoryOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>已完成</span>}
                  value={stats.completed}
                  valueStyle={{ color: '#10B981', fontSize: 24 }}
                  prefix={<ThunderboltOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>今日</span>}
                  value={stats.today}
                  valueStyle={{ color: '#F59E0B', fontSize: 24 }}
                  prefix={<PictureOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={16}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 12
            }}
          >
            <Tabs defaultActiveKey="profile">
              <TabPane
                tab={<span style={{ color: '#fff' }}>基本信息</span>}
                key="profile"
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  initialValues={{
                    nickname: user?.nickname,
                    email: user?.email
                  }}
                >
                  <Form.Item
                    name="email"
                    label={<span style={{ color: '#fff' }}>邮箱</span>}
                  >
                    <Input
                      disabled
                      prefix={<MailOutlined />}
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
                    rules={[{ required: true, message: '请输入昵称' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入昵称"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#fff'
                      }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<EditOutlined />}
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                        border: 'none'
                      }}
                    >
                      保存修改
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane
                tab={<span style={{ color: '#fff' }}>修改密码</span>}
                key="password"
              >
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                >
                  <Form.Item
                    name="oldPassword"
                    label={<span style={{ color: '#fff' }}>当前密码</span>}
                    rules={[{ required: true, message: '请输入当前密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入当前密码"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#fff'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="newPassword"
                    label={<span style={{ color: '#fff' }}>新密码</span>}
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 6, message: '密码至少6位' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入新密码"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#fff'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label={<span style={{ color: '#fff' }}>确认新密码</span>}
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        }
                      })
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请再次输入新密码"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#fff'
                      }}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={passwordLoading}
                      icon={<LockOutlined />}
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                        border: 'none'
                      }}
                    >
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile
