import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import App from './App'

// 全局滚动条样式 - 透明化
const scrollbarStyles = `
  /* 全局滚动条样式 */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    min-height: 50px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 58, 237, 0.5);
  }

  /* Firefox 滚动条 */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  /* Ant Design Table 内部滚动条 */
  .ant-table-body::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  .ant-table-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .ant-table-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    min-height: 50px;
  }

  .ant-table-body::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 58, 237, 0.5);
  }

  /* 菜单滚动条 */
  .ant-menu::-webkit-scrollbar {
    width: 4px;
  }

  .ant-menu::-webkit-scrollbar-track {
    background: transparent;
  }

  .ant-menu::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    min-height: 30px;
  }

  /* Modal 内容滚动条 */
  .ant-modal-body::-webkit-scrollbar {
    width: 6px;
  }

  .ant-modal-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .ant-modal-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    min-height: 50px;
  }

  .ant-modal-body::-webkit-scrollbar-thumb:hover {
    background: rgba(124, 58, 237, 0.5);
  }

  /* 确保内容区域可以滚动 */
  .ant-layout-content {
    overflow: hidden !important;
  }

  /* 修复 Masonry 滚动 */
  .masonry-grid {
    overflow: visible !important;
  }
`

// 注入样式
const styleSheet = document.createElement('style')
styleSheet.innerText = scrollbarStyles
document.head.appendChild(styleSheet)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#7C3AED',
          colorInfo: '#7C3AED',
          colorSuccess: '#10B981',
          colorWarning: '#F59E0B',
          colorError: '#EF4444',
          colorBgBase: '#0F0F0F',
          colorBgContainer: '#1A1A1A',
          colorBorder: '#333333',
          borderRadius: 8,
          fontFamily: "'Inter', 'Noto Sans SC', sans-serif"
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40
          },
          Input: {
            borderRadius: 8,
            controlHeight: 44
          },
          Card: {
            borderRadius: 12
          },
          Modal: {
            borderRadius: 16
          }
        }
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
)
