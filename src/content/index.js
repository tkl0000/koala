import React from 'react';
import { createRoot } from 'react-dom/client';
import ContentScript from './ContentScript';
import '../styles/tailwind.css';

// Create a container for our React app
const container = document.createElement('div');
container.id = 'koala-extension-root';
container.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: auto;
`;

document.body.appendChild(container);

// Render the React component
const root = createRoot(container);
root.render(<ContentScript />);
