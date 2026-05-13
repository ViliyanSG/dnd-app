import { useState, useEffect } from 'react'
import './DriveFilesBrowser.css'

const FOLDER_ID = '1iezhSO3wuWbJtSseeH46BV54dbPrbuCn'
const API_KEY   = import.meta.env.VITE_GOOGLE_API_KEY

const KNOWN_FILES = [
  { name: "Player's Handbook 2024",    filename: "_OceanofPDF.com_Dungeons_and_Dragons_Players_Handbook_2024_-_Wizards_of_the_Coast.pdf", icon: '📖', color: '#c00' },
  { name: "Player's Handbook",         filename: "Player's Handbook.pdf",                                                                  icon: '📖', color: '#a00' },
  { name: "Dungeon Master's Guide 2024", filename: "Dungeons & Dragons 2024 Dungeon Master's Guide -- Wizards of the Coast -- 2024, 2024 -- Wizards of the Coast -- 9780786969524 -- 90445446287de7cdd0e68527d20bfb2e -- Anna's Archive.pdf", icon: '📜', color: '#8b0000' },
  { name: "Dungeon Master's Guide",    filename: "Dungeon Master's Guide.pdf",                                                             icon: '📜', color: '#700' },
  { name: 'Monster Manual 2024',       filename: 'DnD 5e 2024 Monster Manual Alternate Cover.pdf',                                        icon: '👹', color: '#5a0000' },
  { name: 'Monster Manual',            filename: 'Monster Manual.pdf',                                                                    icon: '👹', color: '#400' },
]

export default function DriveFilesBrowser() {
  const [fileIds, setFileIds]     = useState({})   // { filename: id }
  const [showFolder, setShowFolder] = useState(false)

  // Fetch file IDs from Drive API so we can open PDFs directly
  useEffect(() => {
    if (!API_KEY) return
    fetch(
      `https://www.googleapis.com/drive/v3/files` +
      `?q='${FOLDER_ID}'+in+parents` +
      `&fields=files(id,name)` +
      `&pageSize=50` +
      `&key=${API_KEY}`
    )
      .then(r => r.json())
      .then(data => {
        if (data.files) {
          const map = {}
          data.files.forEach(f => { map[f.name] = f.id })
          setFileIds(map)
        }
      })
      .catch(() => {})
  }, [])

  const openFile = (file) => {
    const id = fileIds[file.filename]
    if (id) {
      // Opens directly in browser's PDF viewer / Google Drive preview
      window.open(`https://drive.google.com/file/d/${id}/view`, '_blank')
    } else {
      // Fallback: open the shared folder
      window.open(`https://drive.google.com/drive/folders/${FOLDER_ID}`, '_blank')
    }
  }

  const hasIds = Object.keys(fileIds).length > 0

  return (
    <div className="drive-browser panel">
      <div className="drive-header">
        <div className="section-header" style={{ marginBottom: 0 }}>Books</div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowFolder(v => !v)}
          title="View all files"
        >
          {showFolder ? '📚 List' : '📂 Drive'}
        </button>
      </div>

      {!showFolder ? (
        <div className="drive-files-grid">
          {KNOWN_FILES.map((file) => (
            <button
              key={file.filename}
              className="drive-file-card"
              onClick={() => openFile(file)}
              style={{ '--book-color': file.color }}
              title={hasIds ? 'Open PDF directly' : 'Open in Google Drive'}
            >
              <span className="drive-file-icon">{file.icon}</span>
              <span className="drive-file-name">{file.name}</span>
              <span className="drive-file-open">{hasIds ? 'Open PDF ↗' : 'Open ↗'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="drive-iframe-wrapper">
          <iframe
            src={`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}#list`}
            title="D&D Books"
            className="drive-iframe"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}
