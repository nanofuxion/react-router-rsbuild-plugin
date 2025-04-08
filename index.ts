import fs from 'fs';
import path from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';
import chokidar, { FSWatcher } from 'chokidar';

interface ReactRouterPluginOptions {
  root: string;
  output: string;
  srcAlias?: string;
  layoutFilename?: string;
}

interface RouteDefinition {
  index?: boolean;
  errorElement?: string;
  path?: string;
  element?: string;
  children?: RouteDefinition[];
}

export function reactRouterPlugin({
  root,
  output,
  srcAlias = '',
  layoutFilename = '_layout.tsx',
}: ReactRouterPluginOptions): RsbuildPlugin {
  return {
    name: 'react-router-rsbuild-plugin',
    async setup(api) {
      api.onBeforeCreateCompiler(async () => {
        const watcher = chokidar.watch(root, {
          ignored: [
            /(^|[\/\\])\../,
            '**/node_modules/**',
          ],
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 500,
            pollInterval: 500
          }
        });

        function change() {
          const routes = buildRouteDefinitions(root, {
            layoutFilename,
            root,
            alias: srcAlias,
          });
          const content = generateRouteFile(routes);
          fs.mkdirSync(path.dirname(output), { recursive: true });
          fs.writeFileSync(output, content, 'utf-8');
          console.info(`[reactRouterPlugin] Routes generated at: ${output}`);
        }

        change();
        const logChange = (type: string, filePath: string) => {
          console.log(`[react-router-rsbuild-plugin] ${type}: ${filePath}`);
          change();
        }

        watcher
          .on('add', (filePath) => logChange('File added', filePath))
          .on('unlink', (filePath) => logChange('File removed', filePath))
          .on('addDir', (dirPath) => logChange('Directory added', dirPath))
          .on('unlinkDir', (dirPath) => logChange('Directory removed', dirPath))
          .on('error', (error) => console.error('[react-router-rsbuild-plugin] Watcher error:', error));
      });
    },
  };
}

const validExtensions = ['.tsx', '.jsx', '.ts', '.js'];

function buildRouteDefinitions(
  dir: string,
  options: { layoutFilename: string; root: string; alias: string },
  parentPath = ''
): RouteDefinition[] {
  const entries = fs.readdirSync(dir);
  const children: RouteDefinition[] = [];
  let layoutFile: string | undefined;
  let hasIndex = false;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    const ext = path.extname(entry);
    const name = path.basename(entry, ext);

    if (stat.isFile()) {
      if (entry === options.layoutFilename) {
        layoutFile = entry;
      }
      if (name === 'index') {
        hasIndex = true;
      }
    }
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const nestedRoutes = buildRouteDefinitions(
        fullPath,
        options,
        path.posix.join(parentPath, entry)
      );
      if (nestedRoutes.length > 0 || nestedRoutes.find(r => r.index) || nestedRoutes.find(r => r.element)) {
        if (layoutFile) {
          children.push(...nestedRoutes);
        } else {
          children.push(...nestedRoutes);
        }
      }
    } else if (stat.isFile()) {
      const ext = path.extname(entry);
      if (!validExtensions.includes(ext)) continue;

      if (entry === options.layoutFilename) continue;

      const name = path.basename(entry, ext);
      let routePath = '';
      if (name === 'index') {
        routePath = '';
      } else if (name.startsWith('[') && name.endsWith(']')) {
        routePath = `:${name.slice(1, -1)}`;
      } else {
        routePath = name;
      }

      const importPath = formatImportPath(
        fullPath,
        options.root,
        options.alias
      );

      children.push({
        index: name === 'index',
        path: routePath,
        element: importPath,
      });
    }
  }

  if (layoutFile) {
    const layoutPath = formatImportPath(
      path.join(dir, layoutFile),
      options.root,
      options.alias
    );

    return [
      {
        path: parentPath ? path.basename(parentPath) : '/',
        element: layoutPath,
        children,
      },
    ];
  }

  return children;
}


function formatImportPath(filePath: string, root: string, alias: string): string {
  const rel = path.relative(path.resolve(root, '..'), filePath).replace(/\\/g, '/');
  const noExt = rel.replace(/\.(tsx|ts|js|jsx)$/, '');
  return alias ? alias + noExt.replace(/^src\//, '') : './' + noExt;
}

function generateRouteFile(routes: RouteDefinition[]): string {
  const imports: string[] = [];
  let counter = 0;

  const replaceElements = (nodes: RouteDefinition[]): any[] =>
    nodes.map((node) => {
      const newNode: any = { ...node };
      if (node.element) {
        const varName = `RouteComp${counter++}`;
        imports.push(`import ${varName} from '${node.element}';`);
        newNode.element = varName;
      }
      if (node.children) {
        newNode.children = replaceElements(node.children);
      }
      if (node.path && node.path === path.basename(node.path)) {
        newNode.path = node.path
      }
      if (!node.path) {
        delete newNode.path
      }
      return newNode;
    });

  const routeTree = replaceElements(routes);

  return `${imports.join('\n')}
import React from 'react';
import { type RouteObject } from 'react-router';

const routes: RouteObject[] = ${JSON.stringify(routeTree, null, 2).replace(
    /"element": "RouteComp(\d+)"/g,
    '"element": React.createElement(RouteComp$1)'
  )};

export default routes;
`;
}