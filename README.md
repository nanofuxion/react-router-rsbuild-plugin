# react-router-rsbuild-plugin

Generate fully-typed React Router v6 route definitions automatically from your file structure.

> 🦊 **Optimized for use with [LynxJS](https://lynxjs.dev)** — a native mobile app framework that uses web technologies.  
> ⚠️ **Requires `react-router@6`**

---

## ✨ Features

- Automatically maps your file structure into `RouteObject[]` for `react-router`
- Supports nested layouts (`_layout.tsx`)
- Live updates using `chokidar` when files change
- Clean and idiomatic output: no config necessary per file
- Works with aliases like `@/pages`

---

## 📦 Installation

```bash
npm install react-router react-router-rsbuild-plugin
```

---

## 🛠 Setup

Use this plugin inside your Rsbuild plugin chain.

### `rsbuild.config.ts`
```ts
import { reactRouterPlugin } from 'react-router-rsbuild-plugin';

export default {
  plugins: [
    reactRouterPlugin({
      root: './src/pages', // path to your pages folder
      output: './src/generated/_generated_routes.tsx', // where the routes will be saved
      srcAlias: '@/',
      layoutFilename: '_layout.tsx' // optional, default is '_layout.tsx'
    })
  ]
};
```

---

## 📂 Example File Structure

```
src/
├── pages/
│   ├── _layout.tsx
│   ├── about.tsx
│   ├── index.tsx
│   └── test/
│       ├── _layout.tsx
│       ├── about.tsx
│       └── index.tsx
```

---

## 🧪 Generated Output Example

```ts
import RouteComp0 from '@/pages/_layout';
import RouteComp1 from '@/pages/about';
import RouteComp2 from '@/pages/index';
import RouteComp3 from '@/pages/test/_layout';
import RouteComp4 from '@/pages/test/about';
import RouteComp5 from '@/pages/test/index';
import React from 'react';
import { type RouteObject } from 'react-router';

const routes: RouteObject[] = [
  {
    path: '/',
    element: React.createElement(RouteComp0),
    children: [
      {
        index: false,
        path: 'about',
        element: React.createElement(RouteComp1)
      },
      {
        index: true,
        element: React.createElement(RouteComp2)
      },
      {
        path: 'test',
        element: React.createElement(RouteComp3),
        children: [
          {
            index: false,
            path: 'about',
            element: React.createElement(RouteComp4)
          },
          {
            index: true,
            element: React.createElement(RouteComp5)
          }
        ]
      }
    ]
  }
];

export default routes;
```

---

## ⚛️ Usage in App

```tsx
import { createMemoryRouter, RouterProvider } from 'react-router';
import routes from '@/generated/_generated_routes.tsx';
import React from 'react';

export default function FileRouter(): React.ReactElement {
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("Error: routes is not an array or is empty.");
  }

  const router = createMemoryRouter(routes);
  return <RouterProvider router={router} />;
}
```

---

## 📘 Conventions

- `index.tsx` becomes an `index` route
- `[param].tsx` becomes a dynamic route (`:param`)
- `_layout.tsx` wraps all sibling routes

---

## 🤖 AI Generation

This README and some parts of the project were generated with the help of AI. If you spot anything incorrect or unclear, feel free to suggest improvements — corrections are welcomed and appreciated!

---

## 🚀 Contributing

Pull Requests are warmly welcomed! If you have suggestions, improvements, or new features in mind, feel free to open an issue or submit a PR.

---

## 💬 License

MIT