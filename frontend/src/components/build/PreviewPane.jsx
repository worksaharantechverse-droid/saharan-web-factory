import { useState } from 'react'
import { BUILD_PHASE, PIPELINE_STEPS } from '../../hooks/useBuildPipeline'
import { Icon } from '../ui/Icon'
import './PreviewPane.css'

const DEFAULT_URL = 'http://localhost:4173'

export function PreviewPane({ phase, activeIndex, projectName, previewUrl, error }) {
  const [frameKey, setFrameKey] = useState(0)
  const activeStep = activeIndex >= 0 ? PIPELINE_STEPS[activeIndex] : null
  const liveUrl = previewUrl ?? null
  const ready = phase === BUILD_PHASE.COMPLETE

  return (
    <div className="preview">
      <div className="chrome">
        <div className="chrome-dots" aria-hidden="true">
          <span className="chrome-dot dot-red" />
          <span className="chrome-dot dot-yellow" />
          <span className="chrome-dot dot-green" />
        </div>

        <div className="address-bar">
          <Icon name="lock" size={12} className={ready ? 'addr-lock-on' : ''} />
          <span className="address-text">{liveUrl || DEFAULT_URL}</span>
        </div>

        <button
          type="button"
          className="chrome-reload icon-btn"
          aria-label="Reload preview"
          onClick={() => setFrameKey((k) => k + 1)}
        >
          <Icon name="refresh" size={15} className={phase === BUILD_PHASE.RUNNING ? 'spin' : ''} />
        </button>
      </div>

      <div className="preview-stage">
        {phase === BUILD_PHASE.IDLE && (
          <div className="preview-state">
            <span className="preview-state-icon">
              <Icon name="globe" size={22} strokeWidth={1.5} />
            </span>
            <h3 className="preview-state-title">Waiting to generate</h3>
            <p className="preview-state-body">
              The generated site will be served here on{' '}
              <code className="inline-code">{DEFAULT_URL}</code> or a free port above it.
            </p>
          </div>
        )}

        {phase === BUILD_PHASE.RUNNING && (
          <div className="preview-state">
            <span className="preview-state-ring" aria-hidden="true">
              <span className="preview-ring-spin" />
            </span>
            <h3 className="preview-state-title">Building site…</h3>
            <p className="preview-state-body">
              {activeStep
                ? `${activeStep.label} — ${activeStep.detail}`
                : 'Booting pipeline'}
            </p>
            <div className="preview-progress">
              <span
                className="preview-progress-fill"
                style={{
                  width: `${Math.min(
                    96,
                    ((activeIndex + 1) / PIPELINE_STEPS.length) * 100,
                  )}%`,
                }}
              />
            </div>
            <p className="preview-state-meta">
              step {Math.min(activeIndex + 1, PIPELINE_STEPS.length)} /{' '}
              {PIPELINE_STEPS.length}
            </p>
          </div>
        )}

        {phase === BUILD_PHASE.FAILED && (
          <div className="preview-state">
            <span className="preview-state-icon err">
              <Icon name="refresh" size={22} strokeWidth={1.8} />
            </span>
            <h3 className="preview-state-title">Build failed</h3>
            <p className="preview-state-body">
              {error
                ? String(error).slice(0, 240)
                : 'The pipeline reported an error during the build.'}
            </p>
            <p className="preview-state-meta">
              Check the agent console for details, then go back and regenerate.
            </p>
          </div>
        )}

        {ready && liveUrl && (
          <div className="preview-ready">
            <div className="preview-ready-top">
              <span className="preview-ready-badge">
                <Icon name="check" size={12} strokeWidth={2.4} />
                Site ready
              </span>
              <span className="preview-ready-name">
                {projectName} · {liveUrl}
              </span>
            </div>
            <iframe
              key={frameKey}
              className="preview-iframe"
              src={liveUrl}
              title={`${projectName} preview`}
              sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
            />
          </div>
        )}

        {ready && !liveUrl && (
          <div className="preview-ready">
            <div className="preview-ready-top">
              <span className="preview-ready-badge">
                <Icon name="check" size={12} strokeWidth={2.4} />
                Site ready
              </span>
              <span className="preview-ready-name">{projectName}</span>
            </div>
            <div className="preview-ready-body">
              <span className="preview-state-icon ok">
                <Icon name="cube" size={22} strokeWidth={1.5} />
              </span>
              <h4 className="preview-ready-title">
                This project was already generated
              </h4>
              <p className="preview-state-body">
                A live preview URL is only retained while the build session is
                open. Regenerate from the home screen to get a new preview.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="preview-foot">
        <span className="preview-foot-note">
          <Icon name="shield" size={13} />
          Sandboxed preview · served by Vite
        </span>
      </div>
    </div>
  )
}