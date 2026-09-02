const ICON_PATHS = {
  spark: (
    <>
      <path d="M12 3.5c.55 3.9 2.1 5.45 6 6-3.9.55-5.45 2.1-6 6-.55-3.9-2.1-5.45-6-6 3.9-.55 5.45-2.1 6-6Z" />
      <path d="M18.5 14.5c.27 1.9 1.02 2.66 2.93 2.93-1.9.27-2.66 1.02-2.93 2.93-.27-1.9-1.02-2.66-2.93-2.93 1.9-.27 2.66-1.02 2.93-2.93Z" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M20 12H5" />
      <path d="m11 18-6-6 6-6" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.6 2.3 3.9 5.1 3.9 8.5s-1.3 6.2-3.9 8.5c-2.6-2.3-3.9-5.1-3.9-8.5s1.3-6.2 3.9-8.5Z" />
    </>
  ),
  terminal: (
    <>
      <path d="m4 6 5 5-5 5" />
      <path d="M12 17h8" />
    </>
  ),
  cube: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.6 7.5 4.3 7.5-4.3" />
      <path d="M12 12v9" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M3.5 9h17" />
      <path d="M9 9v11" />
    </>
  ),
  settingsGear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M18.1 5.9l-1.4 1.4M7.3 16.7l-1.4 1.4" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    </>
  ),
  files: (
    <>
      <rect x="9" y="4" width="11" height="13" rx="2" />
      <path d="M15 9.5h5v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 5v5h-5" />
      <path d="M20 10a8 8 0 1 0-2.3 6.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3.5 12.5 8.5 4.7 8.5-4.7" />
      <path d="m3.5 16.5 8.5 4.7 8.5-4.7" />
    </>
  ),
  server: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="2" />
      <rect x="3.5" y="14" width="17" height="7" rx="2" />
      <path d="M7 7.5h.01M7 17.5h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4.5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2V6" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  megaphone: (
    <>
      <path d="M4 9v6h3.5L14 19.5V4.5L7.5 9H4Z" />
      <path d="M4 13.5h-.8a1.8 1.8 0 0 0 0 3H4" />
      <path d="M17.5 9.5a4 4 0 0 1 0 5" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3.5V8M15 3.5V8" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0Z" />
      <path d="M12 17v3.5" />
    </>
  ),
  rocket: (
    <>
      <path d="M13.6 4.2c2-.7 3.8-.3 4.4 1 .7 1.6-.5 4.6-2.5 7.2-1.5 1.9-3.3 3.2-4.7 3.9l-1.8-1.4L16 3.9" />
      <path d="M8.8 14.3c-2 .4-3.4 1.5-3.8 3.6.8.9.7 1.4.2 2.4 2.3-.2 3.7-1.3 4.2-3.2" />
      <path d="M9.4 15.8c-1.4 1.8-2 3.4-2 4.4 1.4.5 2.4-.2 3.8-1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 5.5v5c0 4.5 3 8 7 9 4-1 7-4.5 7-9v-5L12 3Z" />
      <path d="m9 12 2 2 4-4.5" />
    </>
  ),
  panel: (
    <>
      <rect x="3.5" y="4" width="7" height="16" rx="1.5" />
      <rect x="13" y="4" width="7.5" height="16" rx="1.5" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

export function Icon({ name, size = 18, strokeWidth = 1.7, className, style }) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name] ?? null}
    </svg>
  )
}