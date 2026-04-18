import React, { useState, useEffect } from 'react'
import {
  Card, Form, Input, Button, Select, Slider, Row, Col, Space,
  Typography, message, Spin, Tag, Tooltip, Modal, Badge
} from 'antd'
import {
  EditOutlined,
  CopyOutlined,
  ReloadOutlined,
  DeleteOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  CodeOutlined,
  TranslationOutlined,
  HighlightOutlined,
  AlignLeftOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  UserOutlined
} from '@ant-design/icons'
import { subAccountApi } from '../lib/api'
import { useAuthStore } from '../stores/auth'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const MODE_OPTIONS = [
  {
    value: 'write',
    label: '文章写作',
    icon: <FileTextOutlined />,
    desc: '撰写高质量文章',
    placeholder: '请输入文章主题和要点，例如：写一篇关于人工智能对未来工作影响的文章，要求通俗易懂，1500字左右...'
  },
  {
    value: 'continue',
    label: '内容续写',
    icon: <RocketOutlined />,
    desc: '延续已有内容',
    placeholder: '请提供已有的开头或前文，AI会帮你继续写作...'
  },
  {
    value: 'polish',
    label: '文本润色',
    icon: <HighlightOutlined />,
    desc: '优化表达质量',
    placeholder: '粘贴需要润色的文本，AI会帮你优化语法、用词和结构...'
  },
  {
    value: 'summary',
    label: '智能摘要',
    icon: <AlignLeftOutlined />,
    desc: '提炼核心要点',
    placeholder: '粘贴长文，AI会为你生成简洁的摘要...'
  },
  {
    value: 'translate',
    label: '文本翻译',
    icon: <TranslationOutlined />,
    desc: '多语言翻译',
    placeholder: '输入需要翻译的文本，AI会提供准确的翻译...'
  },
  {
    value: 'creative',
    label: '创意写作',
    icon: <EditOutlined />,
    desc: '故事、诗歌创作',
    placeholder: '描述你想要的创意内容，例如：写一个科幻短故事，关于人类首次接触外星文明...'
  },
  {
    value: 'code',
    label: '代码生成',
    icon: <CodeOutlined />,
    desc: '编程辅助',
    placeholder: '描述你需要的代码功能，例如：写一个Python函数，实现快速排序算法...'
  },
  {
    value: 'chat',
    label: '自由对话',
    icon: <MessageOutlined />,
    desc: '问答交流',
    placeholder: '输入你想问的问题或讨论的话题...'
  }
]

const LENGTH_OPTIONS = [
  { value: 500, label: '简洁 (~500字)' },
  { value: 1000, label: '适中 (~1000字)' },
  { value: 2000, label: '详细 (~2000字)' },
  { value: 4000, label: '长文 (~4000字)' }
]

function TextToText() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [selectedMode, setSelectedMode] = useState('write')
  const [stats, setStats] = useState({
    total_subaccounts: 0,
    active_subaccounts: 0,
    inactive_subaccounts: 0,
    total_quota_used: 0,
    total_quota_allocated: 0,
    available_quota: 0
  })

  const currentUser = useAuthStore((state) => state.user)
  const userQuota = currentUser?.quota_daily || 0

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await subAccountApi.getStats()
      setStats(response.data || {})
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  const handleGenerate = async (values) => {
    setLoading(true)
    setResult('')

    try {
      // 模拟生成结果
      setTimeout(() => {
        const mockResponses = {
          write: `这是一篇关于"${values.prompt.substring(0, 30)}..."的文章。\n\n人工智能正在深刻改变着我们的工作方式。从自动化流程到智能决策支持，AI技术正在各个领域发挥着越来越重要的作用。\n\n首先，在重复性工作方面，AI可以大大提高效率。例如，在数据处理、文档整理、客户服务等环节，AI系统可以快速准确地完成任务，让员工能够将精力集中在更有创造性的工作上。\n\n其次，AI为决策提供了强大的数据支持。通过分析海量数据，AI可以发现人类难以察觉的规律和趋势，帮助企业做出更明智的商业决策。\n\n然而，AI的发展也带来了挑战。一些传统岗位可能会被自动化取代，这要求我们不断学习新技能，适应变化。同时，我们也需要关注AI的伦理问题，确保技术的发展符合人类的价值观。\n\n总的来说，AI不是要取代人类，而是要增强人类的能力。未来的工作模式将是人机协作，发挥各自的优势，共同创造更大的价值。`,
          continue: `${values.prompt}\n\n[续写内容]\n\n随着技术的不断进步，这种趋势将会更加明显。我们可以预见，在不久的将来，AI将成为每个人工作中不可或缺的助手。\n\n无论是撰写报告、分析数据，还是创意设计，AI都能提供有价值的建议和支持。关键在于我们如何利用这些工具，让它们为我们的目标服务。`,
          polish: `【润色后的版本】\n\n${values.prompt}\n\n这段文字经过润色后，表达更加清晰流畅，逻辑结构更加严密，用词也更加精准专业。`,
          summary: '【摘要】\n\n本文主要讨论了人工智能对未来工作的影响，包括提高工作效率、支持决策制定、带来的挑战以及人机协作的未来趋势。',
          translate: `【翻译结果】\n\n${values.prompt}\n\nTranslation: This is the translated version of your text, maintaining the original meaning while ensuring natural expression in the target language.`,
          creative: `【创意故事】\n\n基于"${values.prompt.substring(0, 30)}..."，我为你创作了以下内容：\n\n在遥远的未来，人类终于接收到了来自外太空的信号。那不是简单的电磁波，而是一段复杂的有序信息，明显带有智慧生命的特征。\n\n科学家们兴奋又紧张地解读着这段信息。经过数月的努力，他们终于破译了其中的含义：那是一份邀请函，来自距离地球数千光年的一个文明。`,
          code: `\`\`\`python\n# 基于你的需求生成的代码\ndef quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\n# 使用示例\nnumbers = [3, 6, 8, 10, 1, 2, 1]\nprint(quick_sort(numbers))\n# 输出: [1, 1, 2, 3, 6, 8, 10]\n\`\`\``,
          chat: `关于"${values.prompt.substring(0, 30)}..."，我的想法是...\n\n这是一个很有意思的话题。从多个角度来看，这个问题都有其复杂性和多样性。我认为关键在于找到平衡点，既要考虑当前的需求，也要关注长远的发展。\n\n你有什么具体的想法或疑问吗？我很乐意进一步探讨。`
        }

        setResult(mockResponses[values.mode] || mockResponses.write)
        setLoading(false)
      }, 1500)

    } catch (error) {
      message.error('生成失败')
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    message.success('已复制到剪贴板')
  }

  const handleModeChange = (value) => {
    setSelectedMode(value)
    form.setFieldsValue({ prompt: '' })
  }

  const currentMode = MODE_OPTIONS.find(m => m.value === selectedMode)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Title level={4} style={{ color: '#fff', marginBottom: 12, marginTop: 0, flexShrink: 0 }}>
        <EditOutlined style={{ color: '#7C3AED', marginRight: 8 }} />
        AI 写作助手
      </Title>

      <Row gutter={16} style={{ flex: 1, minHeight: 0 }}>
        <Col span={7} style={{ height: '100%' }}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 8,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{ padding: 16, flex: 1, overflow: 'auto' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{
                mode: 'write',
                temperature: 0.7,
                max_tokens: 2000
              }}
            >
              <Form.Item
                name="mode"
                label={<span style={{ color: '#fff', fontSize: 13 }}>写作模式</span>}
              >
                <Select
                  options={MODE_OPTIONS.map(m => ({
                    value: m.value,
                    label: (
                      <Space>
                        {m.icon}
                        <span>{m.label}</span>
                      </Space>
                    )
                  }))}
                  onChange={handleModeChange}
                  style={{ width: '100%' }}
                  dropdownStyle={{ background: '#1A1A1A', border: '1px solid #333' }}
                />
              </Form.Item>

              <div style={{ marginBottom: 12, padding: 10, background: 'rgba(124, 58, 237, 0.1)', borderRadius: 6 }}>
                <Space align="start">
                  {currentMode?.icon}
                  <div>
                    <Text style={{ color: '#fff', fontWeight: 500, fontSize: 13 }}>{currentMode?.label}</Text>
                    <div>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                        {currentMode?.desc}
                      </Text>
                    </div>
                  </div>
                </Space>
              </div>

              <Form.Item
                name="prompt"
                label={<span style={{ color: '#fff', fontSize: 13 }}>输入内容</span>}
                rules={[{ required: true, message: '请输入内容' }]}
                style={{ flex: 1, marginBottom: 12 }}
              >
                <TextArea
                  placeholder={currentMode?.placeholder}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid #333',
                    color: '#fff',
                    resize: 'none',
                    minHeight: 120
                  }}
                />
              </Form.Item>

              <Form.Item
                name="max_tokens"
                label={<span style={{ color: '#fff', fontSize: 13 }}>生成长度</span>}
                style={{ marginBottom: 12 }}
              >
                <Select
                  options={LENGTH_OPTIONS}
                  style={{ width: '100%' }}
                  dropdownStyle={{ background: '#1A1A1A', border: '1px solid #333' }}
                />
              </Form.Item>

              <Form.Item
                name="temperature"
                label={
                  <span style={{ color: '#fff', fontSize: 13 }}>
                    创意程度: {form.getFieldValue('temperature') || 0.7}
                  </span>
                }
                style={{ marginBottom: 16 }}
              >
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  marks={{
                    0: <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>严谨</span>,
                    0.5: <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>平衡</span>,
                    1: <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>创意</span>
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 'auto', marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<EditOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    border: 'none',
                    height: 40
                  }}
                >
                  {loading ? '生成中...' : '开始生成'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={17} style={{ height: '100%' }}>
          <Card
            style={{
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 8,
              height: '100%'
            }}
            bodyStyle={{ padding: 16, height: '100%', overflow: 'auto' }}
          >
            {!result && !loading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'rgba(255,255,255,0.3)'
                }}
              >
                <FileTextOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                  输入内容开始 AI 写作
                </Text>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <Space>
                    <Tag
                      icon={currentMode?.icon}
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 12,
                        padding: '2px 10px'
                      }}
                    >
                      {currentMode?.label}
                    </Tag>
                    {result && (
                      <Badge
                        count={`${result.length} 字`}
                        style={{ backgroundColor: '#52c41a' }}
                      />
                    )}
                  </Space>

                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={handleCopy}
                      disabled={!result}
                      size="small"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#fff'
                      }}
                    >
                      复制
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => form.submit()}
                      loading={loading}
                      size="small"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #333',
                        color: '#fff'
                      }}
                    >
                      重新生成
                    </Button>
                    <Button
                      icon={<DeleteOutlined />}
                      danger
                      onClick={() => setResult('')}
                      disabled={!result}
                      size="small"
                    >
                      清空
                    </Button>
                  </Space>
                </div>

                {loading ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                        AI 正在思考中...
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 8,
                      padding: 20,
                      flex: 1,
                      overflow: 'auto'
                    }}
                  >
                    <Paragraph
                      style={{
                        color: '#fff',
                        fontSize: 14,
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap',
                        margin: 0
                      }}
                    >
                      {result}
                    </Paragraph>
                  </div>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default TextToText
