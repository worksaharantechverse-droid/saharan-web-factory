import fs from 'node:fs/promises'
import path from 'node:path'

const SHARED_DEPS = new Set(['react', 'react-dom'])

export function slugify(name) {
  const slug = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'website'
}

export function buildInstructions({ prompt, spec, buildId }) {
  const colors = (spec.design?.colors ?? []).join(', ')
  return `# ${spec.projectName}

## Original request

> ${prompt.replace(/\n+/g, ' ')}

## Planning spec (from Qwen / qwen2.5-coder:7b)

- Description: ${spec.description}
- Framework: ${spec.framework} · ${spec.buildTool}
- Style: ${spec.design?.style ?? ''}
- Colors: ${colors}
- Typography: ${spec.design?.typography ?? ''}
- Pages: ${spec.pages.join(', ')}
- Components: ${spec.components.join(', ')}
- Features: ${spec.features.join(', ')}
- Dependencies: ${(spec.dependencies ?? []).join(', ') || '(none beyond scaffold)'}

## Build references

- Vite dev server: npm run dev
- Production build: npm run build
- Build id: ${buildId}
`
}

const SCAFFOLD = {
  'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>__PROJECT_NAME__</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
  'src/main.jsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  'src/App.jsx': `export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Welcome</h1>
      <p>This project has been scaffolded and is ready for the agent to implement.</p>
    </main>
  )
}
`,
  'src/index.css': `:root {
  color-scheme: light;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
`,
}

function fixture() {
  const files = {}
  for (const [name, content] of Object.entries(SCAFFOLD)) {
    files[name] = content
  }
  return files
}

export async function createProject(workspaceRoot, buildId, spec) {
  const dir = path.join(workspaceRoot, buildId)
  await fs.mkdir(dir, { recursive: true })
  await fs.mkdir(path.join(dir, 'src'), { recursive: true })

  const extraDeps = (spec.dependencies ?? []).filter(
    (dep) => !SHARED_DEPS.has(dep) && /^[a-z0-9][a-z0-9._/-]*$/.test(dep),
  )

  const packageJson = {
    name: slugify(spec.projectName),
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^19.2.8',
      'react-dom': '^19.2.8',
      ...Object.fromEntries(extraDeps.map((dep) => [dep, 'latest'])),
    },
    devDependencies: {
      vite: '^8.2.2',
      '@vitejs/plugin-react': '^6.1.0',
    },
  }

  const files = {
    ...fixture(),
    'package.json': JSON.stringify(packageJson, null, 2),
    'index.html': SCAFFOLD['index.html'].replace('__PROJECT_NAME__', spec.projectName),
  }

  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(path.join(dir, name), content, 'utf8')
  }

  return dir
}

export async function writeBuildInstructions(dir, { prompt, spec, buildId }) {
  await fs.writeFile(
    path.join(dir, 'BUILD_INSTRUCTIONS.md'),
    buildInstructions({ prompt, spec, buildId }),
    'utf8',
  )
}