import { useCallback, useEffect, useRef, useState } from 'react'
import { createBuild, getBuildStatus } from '../services/api'

export const STEP_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DONE: 'done',
  ERROR: 'error',
}

export const BUILD_PHASE = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETE: 'complete',
  FAILED: 'failed',
}

export const PIPELINE_STEPS = [
  {
    id: 'understand',
    label: 'Understanding request',
    detail: 'Parsing your prompt, extracting goals and constraints',
  },
  {
    id: 'plan',
    label: 'Planning website',
    detail: 'Mapping pages, sections and the component tree',
  },
  {
    id: 'vite',
    label: 'Creating Vite project',
    detail: 'Scaffolding a fresh Vite + React project',
  },
  {
    id: 'opencode',
    label: 'OpenCode coding',
    detail: 'Agent writing components, styles and interactions',
  },
  {
    id: 'build',
    label: 'Running build',
    detail: 'Compiling and bundling the project',
  },
  {
    id: 'test',
    label: 'Testing',
    detail: 'Probing the preview server on localhost',
  },
  {
    id: 'preview',
    label: 'Preparing preview',
    detail: 'Booting the local dev server on the allocated port',
  },
]

// Backend build status -> first pipeline step index it maps to.
const STATUS_STEP = {
  planning: 0, // refined per-spec below
  creating: 2,
  coding: 3,
  building: 4,
  testing: 5,
  ready: 6,
  failed: 6,
}

const TOTAL_STEPS = PIPELINE_STEPS.length

export function useBuildPipeline({ onComplete } = {}) {
  const [phase, setPhase] = useState(BUILD_PHASE.IDLE)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [completedCount, setCompletedCount] = useState(0)
  const [errorIndexes, setErrorIndexes] = useState([])
  const [spec, setSpec] = useState(null)
  const [planError, setPlanError] = useState(null)
  const [logs, setLogs] = useState([])
  const [previewUrl, setPreviewUrl] = useState(null)
  const [buildError, setBuildError] = useState(null)
  const startedRef = useRef(false)
  const intervalRef = useRef(null)
  const pollingRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [])

  const clearPoll = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    pollingRef.current = false
  }, [])

  const pushLog = useCallback((text, tone = 'muted') => {
    setLogs((prev) => [...prev, { id: crypto.randomUUID(), time: nowStamp(), text, tone }])
  }, [])

  // Replace the console with the server's authoritative log stream.
  const setServerLogs = useCallback((serverLogs) => {
    const mapped = (serverLogs ?? []).map((entry, index) => ({
      id: `${entry.time}-${index}`,
      time: entry.time,
      text: entry.text,
      tone: entry.tone || 'muted',
    }))
    setLogs(mapped)
  }, [])

  const applySnapshot = useCallback(
    (snapshot) => {
      setSpec(snapshot.spec ?? null)
      setPreviewUrl(snapshot.previewUrl ?? null)
      setBuildError(snapshot.error ?? null)
      setServerLogs(snapshot.logs)

      const status = snapshot.status

      if (status === 'ready') {
        setPhase(BUILD_PHASE.COMPLETE)
        setCompletedCount(TOTAL_STEPS)
        setActiveIndex(-1)
        setErrorIndexes([])
        return
      }

      if (status === 'failed') {
        setPhase(BUILD_PHASE.FAILED)
        setActiveIndex(-1)
        setErrorIndexes([TOTAL_STEPS - 1])
        setCompletedCount(Math.max(0, STATUS_STEP.failed - 1))
        if (!snapshot.error) pushLog('build failed', 'err')
        return
      }

      setPhase(BUILD_PHASE.RUNNING)
      setErrorIndexes([])

      if (status === 'planning') {
        if (snapshot.spec) {
          setCompletedCount(1)
          setActiveIndex(1)
        } else {
          setCompletedCount(0)
          setActiveIndex(0)
        }
        return
      }

      const index = STATUS_STEP[status] ?? 0
      setCompletedCount(index)
      setActiveIndex(index)
    },
    [pushLog, setServerLogs],
  )

  const reset = useCallback(() => {
    clearPoll()
    startedRef.current = false
    setPhase(BUILD_PHASE.IDLE)
    setActiveIndex(-1)
    setCompletedCount(0)
    setErrorIndexes([])
    setSpec(null)
    setPlanError(null)
    setLogs([])
    setPreviewUrl(null)
    setBuildError(null)
  }, [clearPoll])

  const start = useCallback(
    async ({ prompt } = {}) => {
      if (startedRef.current) return
      startedRef.current = true

      reset()
      setPhase(BUILD_PHASE.RUNNING)
      setActiveIndex(0)
      pushLog('scheduling build…', 'muted')

      let buildId
      try {
        const res = await createBuild({ prompt })
        buildId = res?.buildId
      } catch (err) {
        setPhase(BUILD_PHASE.FAILED)
        setActiveIndex(-1)
        setErrorIndexes([TOTAL_STEPS - 1])
        setBuildError(err?.message ?? String(err))
        setPlanError(err?.message ?? String(err))
        pushLog(`build could not start: ${err?.message ?? String(err)}`, 'err')
        return
      }

      if (!buildId) {
        setPhase(BUILD_PHASE.FAILED)
        setActiveIndex(-1)
        setErrorIndexes([TOTAL_STEPS - 1])
        setBuildError('backend did not return a build id')
        setPlanError('backend did not return a build id')
        pushLog('backend did not return a build id', 'err')
        return
      }

      pushLog(`build queued — ${buildId.slice(0, 8)}`, 'ok')

      const poll = async () => {
        if (pollingRef.current) return
        pollingRef.current = true
        try {
          const snapshot = await getBuildStatus(buildId)
          applySnapshot(snapshot)
          if (snapshot.status === 'ready') {
            clearPoll()
            onCompleteRef.current?.()
          } else if (snapshot.status === 'failed') {
            clearPoll()
          }
        } catch (err) {
          pushLog(`status poll failed: ${err?.message ?? String(err)}`, 'err')
        } finally {
          pollingRef.current = false
        }
      }

      poll()
      intervalRef.current = window.setInterval(poll, 1500)
    },
    [applySnapshot, clearPoll, pushLog, reset],
  )

  const complete = useCallback(() => {
    clearPoll()
    setPhase(BUILD_PHASE.COMPLETE)
    setActiveIndex(-1)
    setCompletedCount(TOTAL_STEPS)
    setErrorIndexes([])
    setPlanError(null)
    setBuildError(null)
  }, [clearPoll])

  return {
    phase,
    activeStep: activeIndex >= 0 ? PIPELINE_STEPS[activeIndex] : null,
    activeIndex,
    completedCount,
    errorIndexes,
    spec,
    planError,
    logs,
    previewUrl,
    buildError,
    start,
    reset,
    complete,
  }
}

function nowStamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

export function stepStatusFor(stepIndex, activeIndex, completedCount, errorIndexes = []) {
  if (errorIndexes.includes(stepIndex)) return STEP_STATUS.ERROR
  if (stepIndex < completedCount) return STEP_STATUS.DONE
  if (stepIndex === activeIndex) return STEP_STATUS.ACTIVE
  return STEP_STATUS.PENDING
}