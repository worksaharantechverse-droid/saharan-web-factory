import { useEffect, useRef } from 'react'
import {
  BUILD_PHASE,
  PIPELINE_STEPS,
  STEP_STATUS,
  stepStatusFor,
} from '../../hooks/useBuildPipeline'
import { Icon } from '../ui/Icon'
import './AgentActivity.css'

const STEP_ICONS = {
  understand: 'focus',
  plan: 'layers',
  vite: 'cube',
  opencode: 'terminal',
  build: 'folder',
  test: 'shield',
  preview: 'globe',
}

function StepRow({ step, index, status, isActive }) {
  return (
    <li className={`step-row ${status}`} aria-current={isActive ? 'step' : undefined}>
      <span className="step-rail" aria-hidden="true">
        {status === STEP_STATUS.DONE && (
          <span className="step-status done">
            <Icon name="check" size={13} strokeWidth={2.2} />
          </span>
        )}
        {status === STEP_STATUS.ERROR && (
          <span className="step-status error">
            <Icon name="refresh" size={12} strokeWidth={2.2} />
          </span>
        )}
        {status === STEP_STATUS.ACTIVE && (
          <span className="step-status active">
            <span className="spinner" aria-hidden="true" />
          </span>
        )}
        {status === STEP_STATUS.PENDING && (
          <span className="step-status pending" aria-hidden="true" />
        )}
        {index < PIPELINE_STEPS.length - 1 && <span className="step-connector" />}
      </span>
      <span className="step-body">
        <span className="step-label">
          <span className="step-ico" aria-hidden="true">
            <Icon name={STEP_ICONS[step.id] ?? 'cube'} size={14} strokeWidth={1.7} />
          </span>
          {step.label}
          {status === STEP_STATUS.DONE && (
            <span className="step-time">
              <Icon name="check" size={12} strokeWidth={2.4} />
            </span>
          )}
        </span>
        {isActive && <span className="step-detail">{step.detail}</span>}
      </span>
    </li>
  )
}

function SpecPanel({ spec }) {
  if (!spec) return null
  return (
    <div className="agent-panel">
      <div className="agent-panel-head">
        <span className="agent-title">
          <Icon name="cube" size={14} />
          Specification
        </span>
        <span className="agent-spec-status ok">
          <Icon name="check" size={11} strokeWidth={2.4} />
          from {spec.runtimeModel ?? 'qwen2.5-coder:7b'}
        </span>
      </div>

      <div className="spec">
        <div className="spec-row">
          <span className="spec-key">project</span>
          <span className="spec-value">{spec.projectName}</span>
        </div>
        <p className="spec-desc">{spec.description}</p>

        <div className="spec-grid">
          <div className="spec-block">
            <span className="spec-block-title">Pages</span>
            <SpecList items={spec.pages} />
          </div>
          <div className="spec-block">
            <span className="spec-block-title">Components</span>
            <SpecList items={spec.components} />
          </div>
        </div>

        <div className="spec-block">
          <span className="spec-block-title">Features</span>
          <SpecList items={spec.features} inline />
        </div>

        <div className="spec-row">
          <span className="spec-key">stack</span>
          <span className="spec-value">
            {spec.framework} · {spec.buildTool}
            {spec.dependencies.length > 0 && ` · ${spec.dependencies.join(', ').slice(0, 90)}`}
          </span>
        </div>

        <div className="spec-swatches">
          {spec.design.colors.map((color) => (
            <span className="swatch" key={color} title={color}>
              <span className="swatch-color" style={{ background: color }} />
              <span className="swatch-hex">{color}</span>
            </span>
          ))}
          <span className="swatch-style">{spec.design.style}</span>
          <span className="swatch-type">{spec.design.typography}</span>
        </div>
      </div>
    </div>
  )
}

function SpecList({ items, inline = false }) {
  if (items.length === 0) {
    return <span className="spec-empty">—</span>
  }
  if (inline) {
    return <p className="spec-inline">{items.join(' · ')}</p>
  }
  return (
    <ul className="spec-list">
      {items.map((item) => (
        <li key={item} className="spec-item">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function AgentActivity({ phase, activeIndex, completedCount, errorIndexes, logs, spec }) {
  const logRef = useRef(null)

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  return (
    <div className="agent">
      <div className="agent-panel">
        <div className="agent-panel-head">
          <span className="agent-title">
            <Icon name="panel" size={15} />
            Agent activity
          </span>
          <span className={`agent-elapsed${phase === BUILD_PHASE.RUNNING ? ' is-live' : ''}`}>
            {phase === BUILD_PHASE.COMPLETE
              ? 'complete'
              : phase === BUILD_PHASE.RUNNING
                ? 'running'
                : phase === BUILD_PHASE.FAILED
                  ? 'failed'
                  : 'idle'}
          </span>
        </div>

        <ol className="step-list">
          {PIPELINE_STEPS.map((step, index) => {
            const status = stepStatusFor(index, activeIndex, completedCount, errorIndexes)
            return (
              <StepRow
                key={step.id}
                step={step}
                index={index}
                status={status}
                isActive={status === STEP_STATUS.ACTIVE}
              />
            )
          })}
        </ol>
      </div>

      <SpecPanel spec={spec} />

      <div className="agent-panel">
        <div className="agent-panel-head">
          <span className="agent-title">
            <Icon name="terminal" size={14} />
            Console
          </span>
          <span className="agent-count">{logs.length} events</span>
        </div>
        <div className="agent-console" ref={logRef}>
          {logs.length === 0 ? (
            <p className="console-placeholder">Pipeline output will appear here.</p>
          ) : (
            logs.map((log) => (
              <p className={`console-line tone-${log.tone}`} key={log.id}>
                <span className="console-time">{log.time}</span>
                <span className="console-text">{log.text}</span>
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  )
}