import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import App from './App'

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
