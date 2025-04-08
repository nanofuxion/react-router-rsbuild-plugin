
import { createMemoryRouter, RouterProvider } from 'react-router';
import routes from '@/generated/_generated_routes.jsx';
import './utils/relog.console.js';
import './tailwind.css';
import React from 'react';

export default function FileRouter(): React.ReactElement {
    // Check if routes is an array and has elements
if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("Error: routes is not an array or is empty.");
  } else {
    const router = createMemoryRouter(routes);
      return <RouterProvider router={router} />
  }
}

