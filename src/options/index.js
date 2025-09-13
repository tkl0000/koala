import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard';
import '../styles/tailwind.css';

const container = document.getElementById('options-root');
const root = createRoot(container);
root.render(<Dashboard />);
