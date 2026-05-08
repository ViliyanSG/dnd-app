import { useEffect } from 'react'

export default function Modal({ children, onClose, maxWidth = '900px' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" style={{ width: '100%', maxWidth }}>
        <button className="modal-close" onClick={onClose} title="Close">✕</button>
        {children}
      </div>
    </div>
  )
}
