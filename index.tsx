
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StrategyProvider } from './src/context/StrategyContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <StrategyProvider>
      <App />
    </StrategyProvider>
  </React.StrictMode>
);
