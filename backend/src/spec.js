const MAX_LIST_ITEMS = 30

export function specSchemaExample() {
  return JSON.stringify(
    {
      projectName: 'Silver Article',
      description: 'One paragraph describing the website.',
      framework: 'react',
      buildTool: 'vite',
      pages: ['Home', 'Catalogue', 'Product', 'Cart', 'Checkout'],
      components: ['Header', 'Footer', 'ProductCard', 'CartDrawer'],
      features: ['Product search', 'Add to cart', 'Mobile layout'],
      dependencies: ['react-router-dom'],
      design: {
        style: 'luxury, minimal, elegant',
        colors: ['#0d0d0f', '#c9a86a', '#f4f1eb'],
        typography: 'Playfair Display for headings, Inter for body',
      },
    },
    null,
    2,
  )
}

function asStrings(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : typeof item?.name === 'string' ? String(item.name).trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, MAX_LIST_ITEMS)
}

function normalizeColors(value) {
  if (Array.isArray(value)) {
    return asStrings(value)
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\s]+/)
      .map((c) => c.trim())
      .filter(Boolean)
      .slice(0, MAX_LIST_ITEMS)
  }
  return []
}

export function normalizeSpec(input) {
  const errors = []
  const source = input && typeof input === 'object' ? input : {}

  const projectName =
    typeof source.projectName === 'string' && source.projectName.trim()
      ? source.projectName.trim().slice(0, 60)
      : ''
  if (!projectName) errors.push('projectName must be a non-empty string')

  const description =
    typeof source.description === 'string' && source.description.trim()
      ? source.description.trim().slice(0, 600)
      : ''
  if (!description) errors.push('description must be a non-empty string')

  const framework =
    typeof source.framework === 'string' && source.framework.trim()
      ? source.framework.trim().toLowerCase().slice(0, 30)
      : 'react'

  const buildTool =
    typeof source.buildTool === 'string' && source.buildTool.trim()
      ? source.buildTool.trim().toLowerCase().slice(0, 30)
      : 'vite'

  const pages = asStrings(source.pages)
  if (pages.length === 0) errors.push('pages must contain at least one page')

  const components = asStrings(source.components)
  if (components.length === 0) errors.push('components must contain at least one component')

  const features = asStrings(source.features)
  const dependencies = asStrings(source.dependencies)

  const rawDesign = source.design && typeof source.design === 'object' ? source.design : {}
  const design = {
    style:
      typeof rawDesign.style === 'string' && rawDesign.style.trim()
        ? rawDesign.style.trim().slice(0, 160)
        : '',
    colors: normalizeColors(rawDesign.colors),
    typography:
      typeof rawDesign.typography === 'string' && rawDesign.typography.trim()
        ? rawDesign.typography.trim().slice(0, 200)
        : '',
  }
  if (!design.style) errors.push('design.style must be a non-empty string')
  if (design.colors.length === 0) errors.push('design.colors must contain at least one color')

  return {
    ok: errors.length === 0,
    errors,
    spec: {
      projectName,
      description,
      framework,
      buildTool,
      pages,
      components,
      features,
      dependencies,
      design,
    },
  }
}