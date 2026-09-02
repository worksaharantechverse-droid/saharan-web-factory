import { useEffect } from 'react'
import {
  BUILD_PHASE,
  useBuildPipeline,
} from '../../hooks/useBuildPipeline'
import { ConnectionIndicator } from '../ui/ConnectionIndicator'
import { Icon } from '../ui/Icon'
import { AgentActivity } from './AgentActivity'
import { PreviewPane } from './PreviewPane'
import './BuildWorkspace.css'

export function BuildWorkspace({
  project,
  prompt,
  onBack,
  onComplete,
  autoStart = true,
}) {
  const pipeline = useBuildPipeline({
    onComplete: () => onComplete?.(project.id),
  })
  const { phase, spec, previewUrl, buildError, start, complete } = pipeline

  useEffect(() => {
    if (autoStart) start({ prompt })
    else complete()
  }, [autoStart, start, complete, prompt])

  const displayName = spec?.projectName ?? project.name

  const title =
    phase === BUILD_PHASE.COMPLETE
      ? 'Site ready'
      : phase === BUILD_PHASE.RUNNING
        ? 'Building'
        : phase === BUILD_PHASE.FAILED
          ? 'Build failed'
          : 'Workspace'

  return (
    <div className="workspace">
      <div className="workspace-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <Icon name="arrowLeft" size={15} />
          Back
        </button>

        <div className="workspace-title">
          <span className="workspace-name">{displayName}</span>
          <span className="workspace-state">
            {phase === BUILD_PHASE.RUNNING && (
              <>
                <span className="state-spinner" aria-hidden="true" />
                {title}
              </>
            )}
            {phase === BUILD_PHASE.COMPLETE && (
              <>
                <Icon name="check" size={12} strokeWidth={2.4} className="state-check" />
                {title}
              </>
            )}
            {phase === BUILD_PHASE.FAILED && (
              <>
                <Icon name="refresh" size={12} strokeWidth={2.4} className="state-err" />
                {title}
              </>
            )}
            {phase === BUILD_PHASE.IDLE && (
              <span className="state-check">{title}</span>
            )}
          </span>
        </div>

        <div className="workspace-actions">
          {phase === BUILD_PHASE.COMPLETE && previewUrl && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              Open preview
              <Icon name="external" size={14} />
            </button>
          )}
          <ConnectionIndicator />
        </div>
      </div>

      <div className="prompt-strip">
        <span className="prompt-strip-label">
          <Icon name="terminal" size={13} />
          Prompt
        </span>
        <p className="prompt-strip-text">{prompt}</p>
      </div>

      <div className="workspace-body">
        <div className="workspace-col left">
          <AgentActivity
            phase={pipeline.phase}
            activeIndex={pipeline.activeIndex}
            completedCount={pipeline.completedCount}
            errorIndexes={pipeline.errorIndexes}
            logs={pipeline.logs}
            spec={spec}
            buildError={buildError}
          />
        </div>
        <div className="workspace-col right">
          <PreviewPane
            phase={pipeline.phase}
            activeIndex={pipeline.activeIndex}
            projectName={displayName}
            previewUrl={previewUrl}
            error={buildError}
          />
        </div>
      </div>
    </div>
  )
}