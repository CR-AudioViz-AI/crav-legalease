'use client'

import { useState, useEffect } from 'react'
import { Clock, Download, RotateCcw, User, FileText } from 'lucide-react'

interface Version {
  id: string
  version_number: number
  original_content: string
  converted_content: string
  notes: string
  created_at: string
  created_by: string
}

interface DocumentVersionHistoryProps {
  documentId: string
}

export default function DocumentVersionHistory({ documentId }: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [documentId])

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`)
      const data = await response.json()
      setVersions(data.versions || [])
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const restoreVersion = async (versionId: string) => {
    if (!confirm('Restore this version? This will create a new version.')) return
    
    try {
      await fetch(`/api/documents/${documentId}/versions/${versionId}/restore`, {
        method: 'POST'
      })
      fetchVersions()
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }

  const downloadVersion = (version: Version) => {
    const blob = new Blob([version.converted_content || version.original_content], 
      { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-v${version.version_number}.txt`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Version History</h2>
        <div className="text-sm text-gray-600">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading versions...</div>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className={`bg-white rounded-lg border-2 p-6 transition-all ${
                selectedVersion?.id === version.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    index === 0 ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <FileText className={index === 0 ? 'text-green-600' : 'text-gray-600'} size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Version {version.version_number}
                      </h3>
                      {index === 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                      {version.created_by && (
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {version.created_by}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadVersion(version)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  {index !== 0 && (
                    <button
                      onClick={() => restoreVersion(version.id)}
                      className="flex items-center gap-2 px-3 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <RotateCcw size={16} />
                      Restore
                    </button>
                  )}
                </div>
              </div>

              {version.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{version.notes}</p>
                </div>
              )}

              <button
                onClick={() => setSelectedVersion(
                  selectedVersion?.id === version.id ? null : version
                )}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedVersion?.id === version.id ? 'Hide' : 'View'} content
              </button>

              {selectedVersion?.id === version.id && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Original Content:</h4>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {version.original_content}
                      </p>
                    </div>
                  </div>
                  {version.converted_content && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Converted Content:</h4>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {version.converted_content}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {versions.length === 0 && !loading && (
        <div className="text-center py-12">
          <Clock className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No version history</h3>
          <p className="text-gray-600">Versions will appear here as changes are made</p>
        </div>
      )}
    </div>
  )
}
