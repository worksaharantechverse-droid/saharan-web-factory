import './Footer.css'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-brand">
          <span className="footer-mark">SWF</span>
          Saharan Web Factory · v0.1
        </p>
        <div className="footer-pipeline">
          <span className="footer-pipe">Prompt →</span>
          <span className="footer-pipe">Ollama</span>
          <span className="footer-pipe">Qwen 2.5 Coder</span>
          <span className="footer-pipe">Vite</span>
          <span className="footer-pipe">OpenCode</span>
          <span className="footer-pipe">Preview</span>
        </div>
      </div>
    </footer>
  )
}