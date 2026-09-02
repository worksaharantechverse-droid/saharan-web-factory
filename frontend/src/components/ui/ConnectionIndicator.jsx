import { CONNECTION_STATES, useOllamaConnection } from '../../hooks/useOllamaConnection'
import { Icon } from './Icon'
import './ConnectionIndicator.css'

const CONFIG = {
  [CONNECTION_STATES.CHECKING]: { label: 'Checking AI', icon: null },
  [CONNECTION_STATES.ONLINE]: { label: 'Local AI · Online', icon: null },
  [CONNECTION_STATES.OFFLINE]: { label: 'Local AI · Offline', icon: 'plug' },
}

export function ConnectionIndicator() {
  const { state } = useOllamaConnection()
  const { label, icon } = CONFIG[state]

  return (
    <div className={`conn conn-${state}`} title="Ollama on localhost:11434">
      <span className="conn-dot" aria-hidden="true" />
      {icon ? <Icon name={icon} size={13} strokeWidth={2} /> : null}
      <span className="conn-label">{label}</span>
    </div>
  )
}