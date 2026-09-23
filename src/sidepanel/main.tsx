import React from 'react';
import ReactDOM from 'react-dom/client';
import { SidePanelApp } from './SidePanelApp';
import '../shared/styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>
);
