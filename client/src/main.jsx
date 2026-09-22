/**
 * File: client/src/main.jsx
 * Description:
 *   React Application Entry Point.
 *   - Mounts the root React DOM tree with React.StrictMode.
 *   - Loads global Tailwind CSS styles and font tokens.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
