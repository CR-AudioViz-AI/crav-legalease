'use client'

import { useState } from 'react'
import { Search, Filter, Calendar, Tag, FileText, Download } from 'lucide-react'

export default function AdvancedSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [filters, setFilters] = useState({
    document_type: '',
    status: '',
    created_after: '',
    created_before: '',
    tags: '',
    is_archived: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: query, ...filters })
      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      setResults(data.documents || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
        <p className="text-gray-600 mt-1">Search across all documents with filters</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search documents by title or content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter size={20} />
          Filters
        </button>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Search Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <select
                value={filters.document_type}
                onChange={(e) => setFilters({ ...filters, document_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                <option value="contract">Contract</option>
                <option value="agreement">Agreement</option>
                <option value="terms">Terms</option>
                <option value="policy">Policy</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archived
              </label>
              <select
                value={filters.is_archived}
                onChange={(e) => setFilters({ ...filters, is_archived: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="false">Active Only</option>
                <option value="true">Archived Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created After
              </label>
              <input
                type="date"
                value={filters.created_after}
                onChange={(e) => setFilters({ ...filters, created_after: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created Before
              </label>
              <input
                type="date"
                value={filters.created_before}
                onChange={(e) => setFilters({ ...filters, created_before: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="urgent, legal, contract"
                value={filters.tags}
                onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilters({
                document_type: '',
                status: '',
                created_after: '',
                created_before: '',
                tags: '',
                is_archived: ''
              })}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">Searching...</div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">{results.length} results found</p>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={16} />
              Export Results
            </button>
          </div>

          {results.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {doc.original_content?.substring(0, 200)}...
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {doc.document_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    {doc.tags && doc.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        {doc.tags.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : query || Object.values(filters).some(v => v) ? (
        <div className="text-center py-12">
          <Search className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters</p>
        </div>
      ) : null}
    </div>
  )
}
