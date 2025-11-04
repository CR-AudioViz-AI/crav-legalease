'use client'

import { useState, useEffect } from 'react'
import { BarChart3, FileText, Users, CheckCircle, Archive, TrendingUp } from 'lucide-react'

interface AnalyticsData {
  summary: {
    total_documents: number
    active_users: number
    pending_approvals: number
    archived_documents: number
  }
  documents_by_type: Record<string, number>
  documents_by_status: Record<string, number>
  team_statistics: Array<{
    team_id: string
    team_name: string
    document_count: number
  }>
}

export default function AnalyticsDashboard({ organizationId }: { organizationId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [organizationId, timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `/api/reports/analytics?organization_id=${organizationId}`
      )
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="text-center py-12">No analytics data available</div>
  }

  const stats = [
    {
      name: 'Total Documents',
      value: analytics.summary.total_documents,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
      change: '+12%'
    },
    {
      name: 'Active Users',
      value: analytics.summary.active_users,
      icon: Users,
      color: 'bg-green-100 text-green-600',
      change: '+8%'
    },
    {
      name: 'Pending Approvals',
      value: analytics.summary.pending_approvals,
      icon: CheckCircle,
      color: 'bg-yellow-100 text-yellow-600',
      change: '-5%'
    },
    {
      name: 'Archived',
      value: analytics.summary.archived_documents,
      icon: Archive,
      color: 'bg-gray-100 text-gray-600',
      change: '+3%'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Organization performance and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp size={14} />
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value.toLocaleString()}</h3>
              <p className="text-sm text-gray-600">{stat.name}</p>
            </div>
          )
        })}
      </div>

      {/* Documents by Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Documents by Type</h2>
        <div className="space-y-4">
          {Object.entries(analytics.documents_by_type).map(([type, count]) => {
            const total = analytics.summary.total_documents
            const percentage = total > 0 ? (count / total) * 100 : 0
            
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                  <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Team Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Team Performance</h2>
        <div className="space-y-4">
          {analytics.team_statistics.map((team) => (
            <div key={team.team_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{team.team_name}</h3>
                  <p className="text-sm text-gray-600">{team.document_count} documents</p>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Document Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Document Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analytics.documents_by_status).map(([status, count]) => (
            <div key={status} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 capitalize mb-1">{status}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
