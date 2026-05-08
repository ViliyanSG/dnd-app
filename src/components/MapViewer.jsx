import { useState, useRef, useCallback, useEffect } from 'react'
import { useRoom } from '../context/RoomContext'
import './MapViewer.css'

export default function MapViewer({ readonly = false }) {
  const { room, updateMap, uploadMap } = useRoom()

  // DM: syncs to DB; Player: local only
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart]   = useState({ x: 0, y: 0 })
  const [urlInput, setUrlInput]     = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Sync DM's saved config to local transform on load
  useEffect(() => {
    if (room?.map_config && !readonly) {
      setTransform(room.map_config)
    }
  }, [room?.code])

  // Zoom with mouse wheel
  const onWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.91
    setTransform(t => {
      const newScale = Math.min(10, Math.max(0.1, t.scale * factor))
      return { ...t, scale: newScale }
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd,   { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  }, [onTouchStart, onTouchMove, onTouchEnd])

  // Mouse drag to pan
  const onMouseDown = (e) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
  }
  const onMouseMove = useCallback((e) => {
    if (!isDragging) return
    setTransform(t => ({ ...t, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }))
  }, [isDragging, dragStart])
  const onMouseUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    // Save DM viewport to DB
    if (!readonly) {
      setTransform(t => {
        updateMap(undefined, t)
        return t
      })
    }
  }, [isDragging, readonly, updateMap])

  // Touch support (pan + pinch-to-zoom)
  const touchRef = useRef(null) // { type: 'pan'|'pinch', ... }

  const getTouchDist = (t1, t2) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
  const getTouchMid = (t1, t2) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  })

  const onTouchStart = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      touchRef.current = {
        type: 'pan',
        startX: e.touches[0].clientX - transform.x,
        startY: e.touches[0].clientY - transform.y,
      }
    } else if (e.touches.length === 2) {
      touchRef.current = {
        type: 'pinch',
        dist: getTouchDist(e.touches[0], e.touches[1]),
        mid:  getTouchMid(e.touches[0], e.touches[1]),
        startScale: transform.scale,
        startX: transform.x,
        startY: transform.y,
      }
    }
  }, [transform])

  const onTouchMove = useCallback((e) => {
    e.preventDefault()
    const ref = touchRef.current
    if (!ref) return

    if (ref.type === 'pan' && e.touches.length === 1) {
      const x = e.touches[0].clientX - ref.startX
      const y = e.touches[0].clientY - ref.startY
      setTransform(t => ({ ...t, x, y }))
    } else if (ref.type === 'pinch' && e.touches.length === 2) {
      const newDist  = getTouchDist(e.touches[0], e.touches[1])
      const newMid   = getTouchMid(e.touches[0], e.touches[1])
      const ratio    = newDist / ref.dist
      const newScale = Math.min(10, Math.max(0.1, ref.startScale * ratio))

      // Zoom toward the pinch midpoint
      const dx = newMid.x - ref.mid.x
      const dy = newMid.y - ref.mid.y
      const x  = ref.startX + dx + (newMid.x - ref.mid.x) * (1 - ratio)
      const y  = ref.startY + dy + (newMid.y - ref.mid.y) * (1 - ratio)
      setTransform({ x, y, scale: newScale })
    }
  }, [])

  const onTouchEnd = useCallback((e) => {
    e.preventDefault()
    if (e.touches.length === 0) {
      if (!readonly) setTransform(t => { updateMap(undefined, t); return t })
      touchRef.current = null
    } else if (e.touches.length === 1 && touchRef.current?.type === 'pinch') {
      // Switched from pinch back to pan
      setTransform(t => {
        touchRef.current = {
          type: 'pan',
          startX: e.touches[0].clientX - t.x,
          startY: e.touches[0].clientY - t.y,
        }
        return t
      })
    }
  }, [readonly, updateMap])

  // Reset view
  const resetView = () => {
    const t = { x: 0, y: 0, scale: 1 }
    setTransform(t)
    if (!readonly) updateMap(undefined, t)
  }

  // Upload file
  const handleFileUpload = async (file) => {
    if (!file) return
    setUploading(true)
    const url = await uploadMap(file)
    if (!url) {
      // Fallback: use local object URL (no Supabase storage)
      const localUrl = URL.createObjectURL(file)
      updateMap(localUrl, undefined)
    }
    setUploading(false)
    resetView()
  }

  // URL input
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    updateMap(urlInput.trim(), undefined)
    setUrlInput('')
    setShowUrlInput(false)
    resetView()
  }

  const mapUrl = room?.map_url

  return (
    <div className="map-viewer panel">
      <div className="map-toolbar">
        <div className="section-header" style={{ marginBottom: 0 }}>Map</div>
        <div className="map-controls">
          <button className="btn btn-ghost btn-sm" onClick={resetView} title="Reset view">⊞ Reset</button>
          <span className="map-zoom-val">{Math.round(transform.scale * 100)}%</span>
          {!readonly && (
            <>
              <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? '...' : '📁 Upload'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUrlInput(v => !v)}>🔗 URL</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload(e.target.files[0])}
              />
            </>
          )}
        </div>
      </div>

      {!readonly && showUrlInput && (
        <div className="map-url-row">
          <input
            type="text"
            placeholder="https://... (image URL)"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
          />
          <button className="btn btn-sm" onClick={handleUrlSubmit}>OK</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowUrlInput(false)}>✕</button>
        </div>
      )}

      <div
        ref={containerRef}
        className={`map-canvas${isDragging ? ' dragging' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {mapUrl ? (
          <div
            className="map-image-wrapper"
            style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
          >
            <img src={mapUrl} alt="Map" draggable={false} className="map-image" />
          </div>
        ) : (
          <div className="map-placeholder">
            {readonly
              ? <><p>🗺</p><p>DM has not loaded a map</p></>
              : <><p>🗺</p><p>Upload a map using the button above</p><p className="map-placeholder-sub">Supports JPG, PNG, WebP</p></>
            }
          </div>
        )}
      </div>
    </div>
  )
}
