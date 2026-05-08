import { useState } from 'react'
import './DriveFilesBrowser.css'

const FOLDER_ID = '1iezhSO3wuWbJtSseeH46BV54dbPrbuCn'

// Known files — listed from the public folder
const KNOWN_FILES = [
  { name: "Player's Handbook 2024", filename: "_OceanofPDF.com_Dungeons_and_Dragons_Players_Handbook_2024_-_Wizards_of_the_Coast.pdf", icon: '📖', color: '#c00' },
  { name: "Player's Handbook", filename: "Player's Handbook.pdf", icon: '📖', color: '#a00' },
  { name: "Dungeon Master's Guide 2024", filename: "Dungeons & Dragons 2024 Dungeon Master's Guide -- Wizards of the Coast -- 2024, 2024 -- Wizards of the Coast -- 9780786969524 -- 90445446287de7cdd0e68527d20bfb2e -- Anna's Archive.pdf", icon: '📜', color: '#8b0000' },
  { name: "Dungeon Master's Guide", filename: "Dungeon Master's Guide.pdf", icon: '📜', color: '#700' },
  { name: 'Monster Manual 2024', filename: 'DnD 5e 2024 Monster Manual Alternate Cover.pdf', icon: '👹', color: '#5a0000' },
  { name: 'Monster Manual', filename: 'Monster Manual.pdf', icon: '👹', color: '#400' },
]

export default function DriveFilesBrowser() {
  const [selected, setSelected]   = useState(null)  // { name, viewUrl }
  const [showFolder, setShowFolder] = useState(false)

  const openFile = (file) => {
    // Open folder in Drive filtered to this file (best we can do without IDs)
    const folderUrl = `https://drive.google.com/drive/folders/${FOLDER_ID}`
    setSelected({ name: file.name, folderUrl, icon: file.icon })
  }

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
            >
              <span className="drive-file-icon">{file.icon}</span>
              <span className="drive-file-name">{file.name}</span>
              <span className="drive-file-open">Open ↗</span>
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

      {selected && (
        <div className="drive-modal-overlay" onClick={() => setSelected(null)}>
          <div className="drive-modal" onClick={e => e.stopPropagation()}>
            <div className="drive-modal-header">
              <span>{selected.icon} {selected.name}</span>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="drive-modal-body">
              <p className="drive-open-note">
                Files in Google Drive can be opened directly in the browser.
              </p>
              <a
                href={selected.folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-red"
              >
                📂 Open in Google Drive
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
