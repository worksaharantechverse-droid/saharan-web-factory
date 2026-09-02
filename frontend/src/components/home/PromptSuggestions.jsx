import { SUGGESTED_PROMPTS } from '../../data/content'
import { Icon } from '../ui/Icon'
import './PromptSuggestions.css'

const ICONS = {
  jewellery: 'spark',
  restaurant: 'clock',
  saas: 'rocket',
  portfolio: 'focus',
  ecommerce: 'layers',
}

export function PromptSuggestions({ onSelect }) {
  return (
    <section className="suggestions" aria-label="Prompt suggestions">
      <div className="suggestions-label">
        <span className="suggestions-line" />
        Try an example
        <span className="suggestions-line" />
      </div>
      <div className="suggestions-grid">
        {SUGGESTED_PROMPTS.map((item) => (
          <button
            key={item.id}
            className="suggestion-chip"
            onClick={() => onSelect(item.prompt)}
            type="button"
          >
            <Icon name={ICONS[item.id] ?? 'spark'} size={15} strokeWidth={1.8} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}