import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/background.css'
import './styles/ambient.css'
import './styles/cadence.css'
import App from './App.tsx'

// 动效开关。默认就是全量：本机 Windows 关了「动画效果」，浏览器恒时报 reduce，
// 如果跟着系统走，环境背景/节奏层会全部静止——所以产品体验优先，默认放行。
// ?motion=system 跟随系统；?motion=off 彻底关掉；?motion=full 回到全量。选择记入 localStorage。
const motionParam = new URLSearchParams(window.location.search).get('motion')
if (motionParam === 'full' || motionParam === 'system' || motionParam === 'off') {
  localStorage.setItem('motion', motionParam)
}

const motionMode = localStorage.getItem('motion')
if (motionMode === 'off') {
  document.documentElement.dataset.motion = 'off'
} else if (motionMode === 'system') {
  delete document.documentElement.dataset.motion
} else {
  document.documentElement.dataset.motion = 'full'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
