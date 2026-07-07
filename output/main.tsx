import React from 'react'
import ReactDOM from 'react-dom/client'
import OutputApp from './OutputApp'
import './styles.css'
import '../shared/slide-readability.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OutputApp />
  </React.StrictMode>
)
