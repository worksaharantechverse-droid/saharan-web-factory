import { Icon } from '../ui/Icon'
import './RecentProjects.css'

const STATUS = {
  ready: { label: 'Ready', tone: 'ok' },
  building: { label: 'Building', tone: 'warn' },
  draft: { label: 'Draft', tone: 'faint' },
}

export function RecentProjects({ projects, onOpen }) {
  return (
    <section className="projects">
      <div className="projects-head">
        <h2 className="projects-title">Recent Projects</h2>
        <span className="projects-count">{projects.length}</span>
      </div>

      <div className="projects-grid">
        {projects.map((project) => {
          const status = STATUS[project.status] ?? STATUS.draft
          return (
            <article className={`project-card status-${status.tone}`} key={project.id}>
              <div className="project-card-top">
                <span className="project-card-icon" aria-hidden="true">
                  <Icon name="layout" size={16} strokeWidth={1.7} />
                </span>
                <span className={`badge badge-${status.tone}`}>{status.label}</span>
              </div>

              <h3 className="project-name">{project.name}</h3>
              <p className="project-description">{project.description}</p>

              <div className="project-stack">
                {project.stack.map((tech) => (
                  <span className="chip" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>

              <div className="project-card-foot">
                <span className="project-updated">{project.updated}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpen(project)}
                >
                  Open
                  <Icon name="external" size={14} />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}