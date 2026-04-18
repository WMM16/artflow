import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import GenerateText from './pages/GenerateText'
import GenerateImage from './pages/GenerateImage'
import History from './pages/History'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AccountManagement from './pages/AccountManagement'
import Upgrade from './pages/Upgrade'
import ReversePrompt from './pages/ReversePrompt'
import TextToText from './pages/TextToText'

function PrivateRoute({ children }) {
  const token = useAuthStore((state) => state.token)
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/generate/text" replace />} />
          <Route path="generate/text" element={<GenerateText />} />
          <Route path="generate/image" element={<GenerateImage />} />
          <Route path="generate/text2text" element={<TextToText />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
          <Route path="upgrade" element={<Upgrade />} />
          <Route path="reverse" element={<ReversePrompt />} />
          <Route path="admin" element={<Admin />} />
          <Route path="account-management" element={<AccountManagement />} />
          <Route path="*" element={<Navigate to="/generate/text" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
