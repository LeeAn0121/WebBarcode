import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AdminPage from './AdminPage.tsx'
import './index.css'

const isAdminRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/admin')

// React가 그리기 시작하는 시점에 정적 스플래시 제거
// (App 내부의 Splash 컴포넌트가 동일한 디자인으로 이어받아 깜빡임 없이 연속됨)
document.getElementById('static-splash')?.remove()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminPage /> : <App />}
  </React.StrictMode>,
)
