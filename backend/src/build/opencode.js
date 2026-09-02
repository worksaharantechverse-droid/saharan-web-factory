import { config } from '../config.js'
import { runProcess } from './process.js'

export function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}

export async function runOpenCode({ cwd, prompt, onLine }) {
  const args = ['run', '--auto']
  if (config.opencode.model) args.push('--model', config.opencode.model)
  args.push(prompt)

  return runProcess({
    cmd: config.opencode.bin,
    args,
    cwd,
    timeoutMs: config.opencode.timeoutMs,
    onLine: (chunk, stream) => {
      const cleaned = stripAnsi(chunk)
      if (!cleaned.trim()) return
      for (const line of cleaned.split(/\r?\n/)) {
        const text = line.replace(/\s+$/, '')
        if (text.trim()) onLine?.(text, stream)
      }
    },
  })

}

export function codingPrompt() {
  return [
    'You are the implementation agent for a freshly scaffolded Vite + React website.',
    '',
    '1. Read BUILD_INSTRUCTIONS.md in this project. It contains the complete website specification written by a planning agent, including the original user request.',
    '2. Implement the full website so it faithfully matches that specification.',
    '3. Build clean, reusable React components split into sensible files under src/.',
    '4. Make the site fully responsive for desktop and mobile.',
    '5. Use realistic, high-quality content (real product names, prices, and copy).',
    '6. Follow the design tokens in the specification (colors, style, typography) exactly.',
    '7. Keep the project building with Vite. Do NOT change the build tool or framework away from React + Vite.',
    '8. Run `npm install` whenever you add or need dependencies.',
    '9. Run `npm run build` and fix any errors until the production build succeeds.',
    '10. Verify the finished application by reviewing your work before finishing.',
    '',
    'Constraints: do not remove or edit BUILD_INSTRUCTIONS.md; keep everything inside this project directory; do not add unrelated boilerplate.',
    'When you are done, reply with a short summary of what you built.',
  ].join('\n')
}

export function repairPrompt(buildTail) {
  return [
    'The generated website project in this directory failed its production build. Fix it.',
    '',
    'Last build output:',
    '"""',
    String(buildTail || '(no output)').slice(-8000),
    '"""',
    '',
    'Steps:',
    '1. Inspect the failing files and the BUILD_INSTRUCTIONS.md specification.',
    '2. Fix the errors (and package.json dependencies if a module is missing).',
    '3. Run `npm install` if needed.',
    '4. Run `npm run build` and keep fixing until it passes.',
    '5. Do not remove BUILD_INSTRUCTIONS.md.',
    'Reply with a short summary of what you changed.',
  ].join('\n')
}