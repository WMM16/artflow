import React, { useState, useEffect, useRef } from 'react'
import { Card, Form, Input, Button, Select, Slider, Row, Col, Space, Typography, message, Image, Upload, Progress, Tooltip, Modal } from 'antd'
import {
  ThunderboltOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  PictureOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { generateApi, historyApi } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'

const { Title, Text } = Typography
const { TextArea } = Input
const { Dragger } = Upload

const SIZE_OPTIONS = [
  { label: '正方形 1:1', value: '1024x1024', width: 1024, height: 1024 },
  { label: '竖屏 2:3', value: '1024x1536', width: 1024, height: 1536 },
  { label: '横屏 3:2', value: '1536x1024', width: 1536, height: 1024 },
  { label: '竖屏 9:16', value: '576x1024', width: 576, height: 1024 },
  { label: '横屏 16:9', value: '1024x576', width: 1024, height: 576 }
]

function GenerateImage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [taskId, setTaskId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [fileList, setFileList] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const pollInterval = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [])

  const handleUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
      setFileList([file])
    }
    reader.readAsDataURL(file)
    return false
  }

  const handleGenerate = async (values) => {
    if (fileList.length === 0) {
      message.error('请先上传参考图片')
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      // 检查配额
      const stats = await historyApi.getStats()
      if (stats.data.quota_remaining <= 0) {
        Modal.confirm({
          title: '额度不足',
          content: '今日生成额度已用完，是否前往提升额度？',
          okText: '去提升额度',
          cancelText: '取消',
          onOk: () => {
            navigate('/upgrade')
          }
        })
        setLoading(false)
        return
      }

      const [width, height] = values.size.split('x').map(Number)
      const formData = new FormData()
      formData.append('prompt', values.prompt)
      formData.append('file', fileList[0])
      formData.append('width', width)
      formData.append('height', height)
      formData.append('image_count', values.count)
      formData.append('strength', values.strength)
      if (values.negativePrompt) {
        formData.append('negative_prompt', values.negativePrompt)
      }

      const response = await generateApi.generateFromImage(formData)
      const { task_id } = response.data
      setTaskId(task_id)
      setProgress(10)

      // 开始轮询
      pollInterval.current = setInterval(() => {
        pollTaskStatus(task_id)
      }, 2000)

    } catch (error) {
      message.error(error.response?.data?.detail || '生成失败')
      setLoading(false)
    }
  }

  const pollTaskStatus = async (id) => {
    try {
      const response = await generateApi.getTaskStatus(id)
      const { status, progress: taskProgress, result_urls, error_message } = response.data

      if (status === 'completed') {
        clearInterval(pollInterval.current)
        setResults(result_urls)
        setProgress(100)
        setLoading(false)
        setTaskId(null)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#4F46E5', '#A855F7']
        })
      } else if (status === 'failed') {
        clearInterval(pollInterval.current)
        message.error(error_message || '生成失败')
        setLoading(false)
        setTaskId(null)
      } else {
        setProgress(taskProgress || 50)
      }
    } catch (error) {
      console.error('Poll error:', error)
    }
  }

  const handleDownload = async (url) => {
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = `artflow-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    setFileList([])
  }

  return (
    <div>
      <Title level={3} style={{ color: '#fff', marginBottom: 24 }}>
        <PictureOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        图生图
      </Title>

      <Row gutter={24}>
        <Col span={8}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 12
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{
                size: '1024x1024',
                count: 1,
                strength: 0.7
              }}
            >
              <Form.Item
                label={<span style={{ color: '#fff' }}>参考图片</span>}
                required
              >
                {previewUrl ? (
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                    <Image
                      src={previewUrl}
                      style={{ width: '100%', height: 200, objectFit: 'cover' }}
                      preview={false}
                    />
                    <Button
                      icon={<CloseOutlined />}
                      danger
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none'
                      }}
                      onClick={handleRemoveImage}
                    />
                  </div>
                ) : (
                  <Dragger
                    accept="image/*"
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px dashed #7C3AED',
                      borderRadius: 8,
                      padding: '20px 0'
                    }}
                  >
                    <UploadOutlined style={{ fontSize: 32, color: '#7C3AED' }} />
                    <div style={{ marginTop: 8, color: '#fff' }}>
                      点击或拖拽上传图片
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      支持 PNG、JPG、WEBP
                    </div>
                  </Dragger>
                )}
              </Form.Item>

              <Form.Item
                name="prompt"
                label={
                  <span style={{ color: '#fff' }}>
                    提示词
                    <Tooltip title="描述你想要的图片效果">
                      <InfoCircleOutlined style={{ marginLeft: 8, color: '#666' }} />
                    </Tooltip>
                  </span>
                }
                rules={[{ required: true, message: '请输入提示词' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="描述你想要的图片效果..."
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #333',
                    color: '#fff',
                    resize: 'none'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="negativePrompt"
                label={<span style={{ color: '#fff' }}>负面提示词</span>}
              >
                <TextArea
                  rows={2}
                  placeholder="不希望在图片中出现的元素..."
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #333',
                    color: '#fff',
                    resize: 'none'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="size"
                label={<span style={{ color: '#fff' }}>图片尺寸</span>}
              >
                <Select
                  options={SIZE_OPTIONS}
                  style={{ width: '100%' }}
                  dropdownStyle={{ background: '#1A1A1A', border: '1px solid #333' }}
                />
              </Form.Item>

              <Form.Item
                name="strength"
                label={
                  <span style={{ color: '#fff' }}>
                    变化强度: {form.getFieldValue('strength') || 0.7}
                  </span>
                }
              >
                <Slider
                  min={0.1}
                  max={1}
                  step={0.1}
                  marks={{
                    0.1: '保守',
                    0.5: '平衡',
                    1: '创新'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="count"
                label={
                  <span style={{ color: '#fff' }}>
                    生成数量: {form.getFieldValue('count') || 1}
                  </span>
                }
              >
                <Slider
                  min={1}
                  max={4}
                  step={1}
                  marks={{ 1: '1', 2: '2', 3: '3', 4: '4' }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                  icon={<ThunderboltOutlined />}
                  disabled={!previewUrl}
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    border: 'none',
                    height: 48,
                    fontSize: 16
                  }}
                >
                  {loading ? `生成中 ${progress}%` : '开始生成'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={16}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 12,
              minHeight: 600
            }}
            bodyStyle={{ padding: 24 }}
          >
            {results.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 500,
                  color: 'rgba(255,255,255,0.3)'
                }}
              >
                <PictureOutlined style={{ fontSize: 80, marginBottom: 24 }} />
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
                  {loading ? '正在生成你的创意作品...' : '上传参考图片开始创作'}
                </Text>
                {loading && (
                  <div style={{ marginTop: 24, width: 200 }}>
                    <div
                      style={{
                        height: 4,
                        background: 'rgba(124, 58, 237, 0.2)',
                        borderRadius: 2,
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #7C3AED, #4F46E5)',
                          borderRadius: 2,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 16 }}>
                    生成结果
                  </Text>
                  <Space>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => form.submit()}
                    >
                      重新生成
                    </Button>
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => setResults([])}
                    >
                      清空
                    </Button>
                  </Space>
                </div>
                <Row gutter={[16, 16]}>
                  {results.map((url, index) => (
                    <Col span={results.length === 1 ? 24 : 12} key={index}>
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '1px solid #333'
                        }}
                      >
                        <Image
                          src={url}
                          alt={`生成结果 ${index + 1}`}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                          preview={{
                            mask: (
                              <div>
                                <EyeOutlined style={{ fontSize: 24 }} />
                                <div style={{ marginTop: 8 }}>预览</div>
                              </div>
                            )
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            display: 'flex',
                            gap: 8
                          }}
                        >
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(url)}
                            style={{
                              background: 'rgba(0,0,0,0.7)',
                              border: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default GenerateImage
