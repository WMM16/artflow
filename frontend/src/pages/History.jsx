import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Image, Button, Select, DatePicker, Empty, Spin, Tag, Space, Modal, message } from 'antd'
import {
  HistoryOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  CalendarOutlined,
  FilterOutlined
} from '@ant-design/icons'
import Masonry from 'react-masonry-css'
import dayjs from 'dayjs'
import { historyApi } from '../lib/api'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({
    type: undefined,
    days: undefined,
    page: 1,
    page_size: 20
  })
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [filter])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await historyApi.getHistory(filter)
      setHistory(response.data)
    } catch (error) {
      message.error('获取历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？图片将被永久删除。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await historyApi.deleteHistory(id)
          message.success('删除成功')
          fetchHistory()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleDownload = (url) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `artflow-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('下载成功')
  }

  const getTypeIcon = (type) => {
    return type === 'text2img' ? <ThunderboltOutlined /> : <PictureOutlined />
  }

  const getTypeLabel = (type) => {
    return type === 'text2img' ? '文生图' : '图生图'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'processing':
        return 'processing'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      case 'processing':
        return '生成中'
      default:
        return '等待中'
    }
  }

  const breakpointColumns = {
    default: 4,
    1600: 3,
    1200: 2,
    800: 1
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4} style={{ color: '#fff', marginBottom: 12, marginTop: 0, flexShrink: 0 }}>
        <HistoryOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        历史记录
      </Title>

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
        <Space wrap>
          <FilterOutlined style={{ color: '#7C3AED' }} />
          <Select
            placeholder="类型筛选"
            allowClear
            style={{ width: 120 }}
            size="small"
            value={filter.type}
            onChange={(value) => setFilter({ ...filter, type: value })}
            options={[
              { label: '文生图', value: 'text2img' },
              { label: '图生图', value: 'img2img' }
            ]}
          />
          <Select
            placeholder="时间筛选"
            allowClear
            style={{ width: 120 }}
            size="small"
            value={filter.days}
            onChange={(value) => setFilter({ ...filter, days: value })}
            options={[
              { label: '今天', value: 1 },
              { label: '本周', value: 7 },
              { label: '本月', value: 30 }
            ]}
          />
          <Button type="primary" size="small" onClick={fetchHistory}>
            刷新
          </Button>
        </Space>
      </Card>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <Spin spinning={loading}>
          {history.length === 0 ? (
            <Card
              style={{
                background: '#1A1A1A',
                border: '1px solid #333',
                borderRadius: 8
              }}
            >
              <Empty
                description="暂无历史记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <Masonry
              breakpointCols={breakpointColumns}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {history.map((item) => (
                <Card
                  key={item.id}
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid #333',
                    borderRadius: 8,
                    marginBottom: 12,
                    overflow: 'hidden'
                  }}
                  bodyStyle={{ padding: 0 }}
                  cover={
                    <div style={{ position: 'relative', height: 160, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      {item.result_urls?.[0] ? (
                        <div style={{ width: '100%', height: '100%' }}>
                          <Image
                            src={item.result_urls[0]}
                            alt={item.prompt}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            preview={{ mask: <EyeOutlined style={{ fontSize: 20 }} /> }}
                          />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Tag color={getStatusColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </Tag>
                        </div>
                      )}
                      {item.result_urls && item.result_urls.length > 1 && (
                        <Tag
                          color="#7C3AED"
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none'
                          }}
                        >
                          +{item.result_urls.length - 1}
                        </Tag>
                      )}
                    </div>
                  }
                >
                  <div style={{ padding: 10 }}>
                    <div style={{ marginBottom: 6 }}>
                      <Tag icon={getTypeIcon(item.type)} color="#7C3AED" size="small">
                        {getTypeLabel(item.type)}
                      </Tag>
                      <Tag color={getStatusColor(item.status)} size="small">
                        {getStatusLabel(item.status)}
                      </Tag>
                    </div>
                    <Text
                      ellipsis={{ rows: 2 }}
                      style={{
                        color: 'rgba(255,255,255,0.8)',
                        display: 'block',
                        fontSize: 12,
                        marginBottom: 6
                      }}
                    >
                      {item.prompt}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 11,
                        display: 'block',
                        marginBottom: 8
                      }}
                    >
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    <Space size="small">
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => item.result_urls?.[0] && handleDownload(item.result_urls[0])}
                        disabled={!item.result_urls?.[0]}
                      >
                        下载
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(item.id)}
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </Card>
              ))}
            </Masonry>
          )}
        </Spin>
      </div>

      <style>{`
        .masonry-grid {
          display: flex;
          margin-left: -12px;
          width: auto;
        }
        .masonry-grid-column {
          padding-left: 12px;
          background-clip: padding-box;
        }
      `}</style>
    </div>
  )
}

export default History
