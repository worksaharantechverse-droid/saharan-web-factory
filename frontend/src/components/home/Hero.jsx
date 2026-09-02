import { useEffect, useRef, useState } from 'react'
import { MODEL_OPTIONS } from '../../data/content'
import { Icon } from '../ui/Icon'
import './Hero.css'

export function Hero({ prompt, onPromptChange, onGenerate }) {
  const [modelId, setModelId] = useState(MODEL_OPTIONS[0].id)
  const textareaRef = useRef(null)
  const model = MODEL_OPTIONS.find((m) => m.id === modelId) ?? MODEL_OPTIONS[0]
  const canGenerate = prompt.trim().length > 0

  useEffect(() => {
    const t = textareaRef.current
    if (!t) return
    t.style.height = '0px'
    t.style.height = `${t.scrollHeight}px`
  }, [prompt])

  function onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canGenerate) onGenerate({ prompt, model })
    }
  }

  return (
    <section className="hero">
      <div className="hero-badge">
        <Icon name="spark" size={14} strokeWidth={1.8} />
        AI website factory, running locally
      </div>

      <h1 className="hero-title">
        Turn your idea into
        <br />
        a <span className="hero-title-accent">website</span>.
      </h1>

      <p className="hero-sub">
        Describe the site you want in plain language. Ollama runs the Qwen 2.5
        Coder model on your machine, plans the build, and OpenCode writes, tests
        and ships it — ready to preview.
      </p>

      <div className="prompt-card">
        <div className="prompt-head">
          <span className="prompt-head-label">
            <Icon name="terminal" size={13} />
            Website prompt
          </span>
          <span className="prompt-enter-kbd" aria-hidden="true">
            <kbd>⌘</kbd>
            <kbd>↵</kbd> to generate
          </span>
        </div>

        <textarea
          ref={textareaRef}
          className="prompt-input"
          placeholder="e.g. Build a premium jewellery ecommerce website for Silver Article with a luxury design, product catalogue, shopping cart and responsive mobile layout."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={4}
          aria-label="Website prompt"
        />

        <div className="prompt-foot">
          <label className="model-select">
            <Icon name="cube" size={15} />
            <span className="model-select-label">Model</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              aria-label="Select AI model"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="model-runner">{model.runner}</span>
            <Icon name="chevronDown" size={15} className="model-caret" />
          </label>

          <button
            type="button"
            className="btn btn-primary btn-lg btn-generate"
            disabled={!canGenerate}
            onClick={() => onGenerate({ prompt, model })}
          >
            Generate Website
            <Icon name="arrowRight" size={17} />
          </button>
        </div>
      </div>
    </section>
  )
}