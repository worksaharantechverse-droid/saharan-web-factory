import { useState } from 'react'
import { ConnectionIndicator } from '../ui/ConnectionIndicator'
import { Icon } from '../ui/Icon'
import './Header.css'

export function Logo({ iconOnly = false }) {
  return (
    <span className="logo" aria-label="Saharan Web Factory">
      <span className="logo-mark" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12c2-5.5 4-8.5 8-8.5S20 6.5 20 12 18 20.5 12 20.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 12.5c0-2.6 1.6-4 4-4s4 1.4 4 4-1.6 4-4 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
        </svg>
      </span>
      {!iconOnly && (
        <span className="logo-word">
          Saharan <span className="logo-accent">Web Factory</span>
        </span>
      )}
    </span>
  )
}

const NAV = [
  { id: 'projects', label: 'Projects' },
  { id: 'templates', label: 'Templates' },
  { id: 'settings', label: 'Settings' },
]

export function Header({ activeView, onNavigate }) {
  const [open, setOpen] = useState(false)

  function handleNav(id) {
    setOpen(false)
    onNavigate(id)
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="header-logo"
          onClick={() => handleNav('home')}
          aria-label="Go to home"
        >
          <Logo />
        </button>

        <nav className="header-nav" aria-label="Primary">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-link${activeView === item.id ? ' is-active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <ConnectionIndicator />
          <button
            className="header-menu icon-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <Icon name={open ? 'chevronUp' : 'layout'} size={18} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="header-mobile" aria-label="Mobile">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-mobile-link${activeView === item.id ? ' is-active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}