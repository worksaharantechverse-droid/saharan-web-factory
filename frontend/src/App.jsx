import { useRef, useState } from 'react'
import { BuildWorkspace } from './components/build/BuildWorkspace'
import { Hero } from './components/home/Hero'
import { PromptSuggestions } from './components/home/PromptSuggestions'
import { RecentProjects } from './components/home/RecentProjects'
import { Footer } from './components/layout/Footer'
import { Header } from './components/layout/Header'
import { Icon } from './components/ui/Icon'
import { projectNameFromPrompt, stubProjects } from './data/content'
import './App.css'

const PLACEHOLDER_VIEWS = {
  templates: {
    icon: 'layout',
    title: 'Templates',
    body: 'A curated library of starting-point templates will live here, ready to be generated locally by Qwen 2.5 Coder.',
  },
  settings: {
    icon: 'settingsGear',
    title: 'Settings',
    body: 'Ollama host, model defaults, port bindings and build preferences will be configured here.',
  },
}

function PlaceholderView({ view }) {
  const data = PLACEHOLDER_VIEWS[view]
  return (
    <section className="placeholder">
      <div className="placeholder-card">
        <span className="placeholder-icon">
          <Icon name={data.icon} size={22} strokeWidth={1.5} />
        </span>
        <span className="badge badge-faint">Coming soon</span>
        <h1 className="placeholder-title">{data.title}</h1>
        <p className="placeholder-body">{data.body}</p>
      </div>
    </section>
  )
}

export default function App() {
  const [view, setView] = useState('home')
  const [prompt, setPrompt] = useState('')
  const [projects, setProjects] = useState(stubProjects)
  const [activeBuild, setActiveBuild] = useState(null)
  const projectsRef = useRef(null)

  function handleGenerate({ prompt: text, model }) {
    if (!text.trim()) return
    const project = {
      id: `proj-${Date.now()}`,
      name: projectNameFromPrompt(text),
      description: text,
      stack: ['React', 'Vite', 'Ollama'],
      status: 'building',
      updated: 'just now',
      url: 'http://localhost:4173',
      model: model?.id ?? 'qwen2.5-coder',
    }
    setProjects((prev) => [project, ...prev])
    setActiveBuild({ project, prompt: text, autoStart: true })
    setPrompt('')
    setView('build')
  }

  function handleOpenProject(project) {
    setActiveBuild({
      project,
      prompt: project.description,
      autoStart: project.status !== 'ready',
    })
    setView('build')
  }

  function handleBuildComplete(projectId) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, status: 'ready', updated: 'just now' } : p,
      ),
    )
  }

  function handleBack() {
    setActiveBuild(null)
    setView('home')
  }

  function handleNavigate(target) {
    if (target === 'projects') {
      setView('home')
      requestAnimationFrame(() => {
        projectsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return
    }
    if (target === 'home') {
      setActiveBuild(null)
      setView('home')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (target === 'build') return
    setView(target)
  }

  const isBuild = view === 'build'

  return (
    <div className="app">
      {!isBuild && <Header activeView={view} onNavigate={handleNavigate} />}

      {isBuild && activeBuild ? (
        <BuildWorkspace
          key={activeBuild.project.id}
          project={activeBuild.project}
          prompt={activeBuild.prompt}
          autoStart={activeBuild.autoStart}
          onBack={handleBack}
          onComplete={handleBuildComplete}
        />
      ) : (
        <>
          {view === 'home' && (
            <main className="home-main">
              <Hero prompt={prompt} onPromptChange={setPrompt} onGenerate={handleGenerate} />
              <PromptSuggestions onSelect={setPrompt} />
              <div ref={projectsRef} id="recent-projects">
                <RecentProjects projects={projects} onOpen={handleOpenProject} />
              </div>
            </main>
          )}
          {view !== 'home' && <PlaceholderView view={view} />}
          <Footer />
        </>
      )}
    </div>
  )
}