import React from 'react';
import { createRoot } from 'react-dom/client';
import CustomPage from './CustomPage';

const container = document.getElementById('custom-page-root');
const root = createRoot(container);
root.render(<CustomPage />);
