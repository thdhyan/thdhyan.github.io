import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { EditorGate } from './EditorGate.jsx'

const isEditor = window.location.pathname.startsWith('/editor')

createRoot(document.getElementById('root')).render(isEditor ? <EditorGate /> : <App />)
