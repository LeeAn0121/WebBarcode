import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AdminPage from './AdminPage.tsx'
import './index.css'

const isAdminRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/admin')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminPage /> : <App />}
  </React.StrictMode>,
)
