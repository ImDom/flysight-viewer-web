import React from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing root element!');
}
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);