export const SUGGESTED_PROMPTS = [
  {
    id: 'jewellery',
    label: 'Jewellery store',
    prompt:
      'Build a premium jewellery ecommerce website for Silver Article with a luxury design, product catalogue, shopping cart and responsive mobile layout.',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    prompt:
      'Create a modern restaurant website with a menu section, online reservations, hours and location, and a warm inviting visual style.',
  },
  {
    id: 'saas',
    label: 'SaaS landing page',
    prompt:
      'Build a SaaS landing page for a productivity tool with hero, pricing tiers, feature grid, testimonials, and a strong conversion-focused design.',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    prompt:
      'Design a minimal designer portfolio with project gallery, about section, contact form, and smooth scroll animations.',
  },
  {
    id: 'ecommerce',
    label: 'Ecommerce store',
    prompt:
      'Create a clean ecommerce storefront with product listing, category filters, product detail pages, cart drawer and checkout flow.',
  },
]

export const MODEL_OPTIONS = [
  {
    id: 'qwen2.5-coder',
    label: 'Qwen 2.5 Coder',
    runner: 'Ollama',
    tag: 'qwen2.5-coder:14b',
  },
  {
    id: 'qwen2.5-coder-7b',
    label: 'Qwen 2.5 Coder 7B',
    runner: 'Ollama',
    tag: 'qwen2.5-coder:7b',
  },
  {
    id: 'qwen2.5-coder-small',
    label: 'Qwen 2.5 Coder Small',
    runner: 'Ollama',
    tag: 'qwen2.5-coder:3b',
  },
]

export const stubProjects = [
  {
    id: 'aurora',
    name: 'Aurora Studio',
    description: 'Minimal portfolio for a motion design studio with a project gallery and contact form.',
    stack: ['React', 'Vite', 'Tailwind CSS'],
    status: 'ready',
    updated: '2h ago',
    url: 'http://localhost:4173',
  },
  {
    id: 'silver-article',
    name: 'Silver Article',
    description: 'Premium jewellery storefront with catalogue, cart and a luxury dark visual style.',
    stack: ['React', 'Vite', 'CSS Modules'],
    status: 'ready',
    updated: 'yesterday',
    url: 'http://localhost:4173',
  },
  {
    id: 'ember-kitchen',
    name: 'Ember Kitchen',
    description: 'Modern restaurant site with menu, reservations and an inviting warm colour palette.',
    stack: ['React', 'Vite', 'Tailwind CSS'],
    status: 'building',
    updated: '2h ago',
    url: 'http://localhost:4173',
  },
  {
    id: 'fluxform',
    name: 'Fluxform',
    description: 'SaaS landing page for a workflow tool with pricing tiers and testimonials.',
    stack: ['React', 'Vite'],
    status: 'ready',
    updated: '3d ago',
    url: 'http://localhost:4173',
  },
]

export function projectNameFromPrompt(prompt) {
  const words = prompt
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
  const head = words.slice(0, 2).join(' ')
  if (!head) return 'Untitled site'
  return head.length <= 26 ? head : `${head.slice(0, 26)}…`
}