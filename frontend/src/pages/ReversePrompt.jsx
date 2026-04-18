import React, { useState } from 'react'
import { Card, Row, Col, Typography, Button, Upload, Image, Input, Spin, message, Tag, Tooltip } from 'antd'
import {
  EyeOutlined,
  UploadOutlined,
  CopyOutlined,
  FileImageOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { generateApi } from '../lib/api'

const { Title, Text } = Typography
const { TextArea } = Input

function ReversePrompt() {
  const [fileList, setFileList] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const handleUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
      setFileList([file])
      setResult(null) // 清除之前的结果
    }
    reader.readAsDataURL(file)
    return false
  }

  const handleAnalyze = async () => {
    if (fileList.length === 0) {
      message.error('请先上传图片')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', fileList[0])

      const response = await generateApi.reversePrompt(formData)
      setResult(response.data)
      message.success('分析完成！')
    } catch (error) {
      message.error(error.response?.data?.detail || '分析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const handleUsePrompt = (prompt) => {
    // 跳转到文生图页面，带上提示词
    navigate('/generate/text', { state: { prompt } })
  }

  return (
    <div>
      <Title level={3} style={{ color: '#fff', marginBottom: 24 }}>
        <EyeOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        图片反推
      </Title>

      <Row gutter={24}>
        {/* 左侧：上传区域 */}
        <Col span={10}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 12
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
              <FileImageOutlined style={{ marginRight: 8 }} />
              上传图片
            </Title>

            {previewUrl ? (
              <div style={{ marginBottom: 16 }}>
                <Image
                  src={previewUrl}
                  style={{ width: '100%', borderRadius: 8 }}
                  preview={false}
                />
                <Button
                  block
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    setPreviewUrl(null)
                    setFileList([])
                    setResult(null)
                  }}
                >
                  重新上传
                </Button>
              </div>
            ) : (
              <Upload.Dragger
                accept="image/*"
                beforeUpload={handleUpload}
                showUploadList={false}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed #7C3AED',
                  borderRadius: 8,
                  padding: '40px 0'
                }}
              >
                <UploadOutlined style={{ fontSize: 48, color: '#7C3AED' }} />
                <div style={{ marginTop: 16 }}>
                  <Text style={{ color: '#fff', fontSize: 16 }}>
                    点击或拖拽上传图片
                  </Text>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 }}>
                  支持 PNG、JPG、WEBP 格式
                </div>
              </Upload.Dragger>
            )}

            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              disabled={!previewUrl}
              onClick={handleAnalyze}
              icon={<ThunderboltOutlined />}
              style={{
                marginTop: 24,
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                border: 'none',
                height: 48,
                fontSize: 16
              }}
            >
              {loading ? '分析中...' : '开始分析'}
            </Button>

            <div style={{ marginTop: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                AI 将自动识别图片内容并生成对应的提示词
              </Text>
            </div>
          </Card>
        </Col>

        {/* 右侧：结果展示 */}
        <Col span={14}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 12,
              minHeight: 500
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
              <EyeOutlined style={{ marginRight: 8 }} />
              分析结果
            </Title>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: 'rgba(255,255,255,0.5)' }}>
                  AI 正在分析图片内容...
                </div>
              </div>
            ) : result ? (
              <div>
                {/* 主提示词 */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)' }}>主提示词</Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopy(result.prompt)}
                      style={{ color: '#7C3AED' }}
                    >
                      复制
                    </Button>
                  </div>
                  <TextArea
                    value={result.prompt}
                    readOnly
                    rows={4}
                    style={{
                      background: 'rgba(124, 58, 237, 0.1)',
                      border: '1px solid #7C3AED50',
                      color: '#fff',
                      fontSize: 14
                    }}
                  />
                  <Button
                    type="primary"
                    block
                    style={{
                      marginTop: 12,
                      background: '#7C3AED',
                      border: 'none'
                    }}
                    onClick={() => handleUsePrompt(result.prompt)}
                  >
                    <ThunderboltOutlined /> 使用此提示词生成图片
                  </Button>
                </div>

                {/* 负面提示词 */}
                {result.negative_prompt && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.7)' }}>负面提示词</Text>
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopy(result.negative_prompt)}
                        style={{ color: '#7C3AED' }}
                      >
                        复制
                      </Button>
                    </div>
                    <TextArea
                      value={result.negative_prompt}
                      readOnly
                      rows={2}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 13
                      }}
                    />
                  </div>
                )}

                {/* 识别标签 */}
                {result.tags && result.tags.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 12 }}>
                      识别标签
                    </Text>
                    <div>
                      {result.tags.map((tag, index) => (
                        <Tag
                          key={index}
                          color="#7C3AED"
                          style={{ marginBottom: 8, marginRight: 8 }}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* 风格描述 */}
                {result.style && (
                  <div style={{ marginBottom: 16 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
                      风格识别
                    </Text>
                    <Text style={{ color: '#fff' }}>{result.style}</Text>
                  </div>
                )}

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleUsePrompt(result.prompt)}
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      border: 'none'
                    }}
                  >
                    去生成图片
                  </Button>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(result.prompt)}
                  >
                    复制提示词
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
                <EyeOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <div style={{ fontSize: 16 }}>
                  上传图片并点击分析
                </div>
                <div style={{ fontSize: 13, marginTop: 8 }}>
                  AI 将为你生成对应的提示词
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ReversePrompt
