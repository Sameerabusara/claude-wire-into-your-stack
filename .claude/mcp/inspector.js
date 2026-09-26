#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const tools = [
  {
    name: 'get_routes',
    description: 'List all API routes in the project',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_scripts',
    description: 'List available npm scripts (dev, test, lint)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'run_script',
    description: 'Run an npm script (dev, test, or lint)',
    inputSchema: {
      type: 'object',
      properties: {
        script: {
          type: 'string',
          enum: ['test', 'lint'],
          description: 'The npm script to run'
        }
      },
      required: ['script']
    }
  }
];

function getRoutes() {
  const routes = [];
  const routesDir = path.join(process.cwd(), 'routes');

  if (!fs.existsSync(routesDir)) {
    return routes;
  }

  fs.readdirSync(routesDir).forEach(file => {
    if (file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
      const basePath = '/' + file.replace('.js', '');

      const methods = ['get', 'post', 'put', 'delete', 'patch'];
      methods.forEach(method => {
        const regex = new RegExp(`router\\.${method}\\('([^']+)'`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
          routes.push({
            method: method.toUpperCase(),
            path: basePath + match[1]
          });
        }
      });
    }
  });

  return routes;
}

function getScripts() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  return Object.keys(pkg.scripts || {}).map(name => ({
    name,
    command: pkg.scripts[name]
  }));
}

function runScript(script) {
  return new Promise((resolve) => {
    const proc = spawn('npm', ['run', script], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout,
        stderr
      });
    });
  });
}

async function handleToolCall(toolName, toolInput) {
  switch (toolName) {
    case 'get_routes':
      return { routes: getRoutes() };
    case 'get_scripts':
      return { scripts: getScripts() };
    case 'run_script':
      return await runScript(toolInput.script);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function main() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(JSON.stringify({
    protocolVersion: '2024-11-05',
    capabilities: {},
    serverInfo: {
      name: 'course-api-inspector',
      version: '1.0.0'
    }
  }));

  rl.on('line', async (line) => {
    try {
      const request = JSON.parse(line);

      if (request.method === 'tools/list') {
        console.log(JSON.stringify({
          tools
        }));
      } else if (request.method === 'tools/call') {
        const result = await handleToolCall(request.params.name, request.params.arguments);
        console.log(JSON.stringify({
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }));
      }
    } catch (error) {
      console.log(JSON.stringify({
        error: error.message
      }));
    }
  });
}

main().catch(console.error);
