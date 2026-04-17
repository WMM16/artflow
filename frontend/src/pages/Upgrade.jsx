import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Button, Radio, Tag, Divider, message, Modal, Spin } from 'antd'
import {
  ThunderboltOutlined,
  CheckOutlined,
  CrownOutlined,
  GiftOutlined,
  FireOutlined,
  RocketOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../stores/auth'
import { historyApi } from '../lib/api'

const { Title, Text } = Typography

// 额度套餐配置
const PACKAGES = [
  {
    id: 'basic',
    name: '基础包',
    icon: <GiftOutlined />,
    price: 1,
    quota: 10,
    description: '适合轻度使用者',
    features: ['当日有效', '立即到账', '支持文生图/图生图'],
    popular: false,
    color: '#7C3AED'
  },
  {
    id: 'standard',
    name: '标准包',
    icon: <ThunderboltOutlined />,
    price: 5,
    quota: 60,
    description: '性价比之选',
    features: ['当日有效', '立即到账', '支持文生图/图生图', '平均 ¥0.08/张'],
    popular: true,
    color: '#4F46E5'
  },
  {
    id: 'premium',
    name: '高级包',
    icon: <CrownOutlined />,
    price: 10,
    quota: 150,
    description: '重度用户首选',
    features: ['当日有效', '立即到账', '支持文生图/图生图', '平均 ¥0.06/张', '优先处理队列'],
    popular: false,
    color: '#A855F7'
  },
  {
    id: 'unlimited',
    name: '无限包',
    icon: <RocketOutlined />,
    price: 30,
    quota: 999,
    description: '畅享无限创作',
    features: ['当日有效', '立即到账', '无限生成额度', '优先处理队列', '专属客服支持'],
    popular: false,
    color: '#EC4899'
  }
]

function Upgrade() {
  const [selectedPackage, setSelectedPackage] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [currentQuota, setCurrentQuota] = useState({
    used: 0,
    daily: 10,
    remaining: 10
  })
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchCurrentQuota()
  }, [])

  const fetchCurrentQuota = async () => {
    try {
      const response = await historyApi.getStats()
      const data = response.data
      setCurrentQuota({
        used: data.quota_used,
        daily: data.quota_daily,
        remaining: data.quota_remaining
      })
    } catch (error) {
      console.error('Failed to fetch quota:', error)
    }
  }

  const handlePurchase = async () => {
    const pkg = PACKAGES.find(p => p.id === selectedPackage)
    if (!pkg) return

    Modal.confirm({
      title: '确认购买',
      content: (
        <div>
          <p>您选择了 <strong>{pkg.name}</strong></p>
          <p>价格: <strong style={{ color: '#7C3AED' }}>¥{pkg.price}</strong></p>
          <p>额度: <strong>+{pkg.quota} 张</strong></p>
          <p style={{ color: '#888', fontSize: 12 }}>支付完成后额度将立即到账</p>
        </div>
      ),
      okText: '立即支付',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true)
        try {
          // 这里调用后端支付接口
          // const response = await upgradeApi.purchase(pkg.id)

          // 模拟支付成功
          await new Promise(resolve => setTimeout(resolve, 1500))

          message.success(`购买成功！已增加 ${pkg.quota} 张额度`)
          fetchCurrentQuota()
        } catch (error) {
          message.error('购买失败，请稍后重试')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const selectedPkg = PACKAGES.find(p => p.id === selectedPackage)

  return (
    <div>
      <Title level={3} style={{ color: '#fff', marginBottom: 24 }}>
        <CrownOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        提升额度
      </Title>

      {/* 当前额度状态 */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #7C3AED20, #4F46E520)',
          border: '1px solid #7C3AED50',
          borderRadius: 12,
          marginBottom: 24
        }}
      >
        <Row gutter={24} align="middle">
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>今日已用</Text>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 }}>
                {currentQuota.used}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>剩余额度</Text>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#7C3AED', marginTop: 8 }}>
                {currentQuota.remaining}
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>每日基础</Text>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 }}>
                {currentQuota.daily}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* 套餐选择 */}
        <Row gutter={[16, 16]}>
          {PACKAGES.map((pkg) => (
            <Col xs={24} sm={12} lg={6} key={pkg.id}>
              <Card
                hoverable
                onClick={() => setSelectedPackage(pkg.id)}
                style={{
                  background: selectedPackage === pkg.id ? `${pkg.color}20` : '#1A1A1A',
                  border: selectedPackage === pkg.id ? `2px solid ${pkg.color}` : '1px solid #333',
                  borderRadius: 12,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {pkg.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: pkg.color,
                      color: '#fff',
                      padding: '4px 12px',
                      fontSize: 12,
                      borderBottomLeftRadius: 12
                    }}
                  >
                    推荐
                  </div>
                )}

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${pkg.color}, ${pkg.color}80)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      fontSize: 24,
                      color: '#fff'
                    }}
                  >
                    {pkg.icon}
                  </div>
                  <Title level={4} style={{ color: '#fff', margin: 0 }}>
                    {pkg.name}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    {pkg.description}
                  </Text>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>¥</Text>
                  <Text style={{ fontSize: 36, fontWeight: 'bold', color: pkg.color, margin: '0 4px' }}>
                    {pkg.price}
                  </Text>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Tag
                    color={pkg.color}
                    style={{ fontSize: 16, padding: '4px 16px' }}
                  >
                    +{pkg.quota} 张额度
                  </Tag>
                </div>

                <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                <div style={{ marginBottom: 16 }}>
                  {pkg.features.map((feature, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 13
                      }}
                    >
                      <CheckOutlined style={{ color: pkg.color, fontSize: 12 }} />
                      {feature}
                    </div>
                  ))}
                </div>

                <Button
                  type={selectedPackage === pkg.id ? 'primary' : 'default'}
                  block
                  size="large"
                  icon={selectedPackage === pkg.id ? <ThunderboltOutlined /> : null}
                  style={{
                    background: selectedPackage === pkg.id ? pkg.color : 'transparent',
                    borderColor: pkg.color,
                    color: selectedPackage === pkg.id ? '#fff' : pkg.color,
                    height: 44
                  }}
                >
                  {selectedPackage === pkg.id ? '已选择' : '选择'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 支付区域 */}
        <Card
          style={{
            background: '#1A1A1A',
            border: '1px solid #333',
            borderRadius: 12,
            marginTop: 24
          }}
        >
          <Row gutter={24} align="middle">
            <Col span={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${selectedPkg?.color}, ${selectedPkg?.color}80)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: '#fff'
                  }}
                >
                  {selectedPkg?.icon}
                </div>
                <div>
                  <Title level={5} style={{ color: '#fff', margin: 0 }}>
                    {selectedPkg?.name}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                    增加 {selectedPkg?.quota} 张生成额度 · 当日有效
                  </Text>
                </div>
              </div>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 12 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', marginRight: 8 }}>总计:</Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: selectedPkg?.color }}>
                  ¥{selectedPkg?.price}
                </Text>
              </div>
              <Button
                type="primary"
                size="large"
                onClick={handlePurchase}
                loading={loading}
                icon={<ThunderboltOutlined />}
                style={{
                  background: `linear-gradient(135deg, ${selectedPkg?.color}, ${selectedPkg?.color}80)`,
                  border: 'none',
                  height: 48,
                  fontSize: 16,
                  padding: '0 32px'
                }}
              >
                立即支付
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 说明 */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            <SafetyOutlined style={{ marginRight: 4 }} />
            支付安全由第三方支付平台保障 · 额度购买后立即到账 · 不支持退款
          </Text>
        </div>
      </Spin>
    </div>
  )
}

export default Upgrade
