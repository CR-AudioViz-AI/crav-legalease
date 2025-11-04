'use client';

import { FileText, Users, DollarSign, Activity } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <span className="text-sm text-gray-500">LegalEase AI</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Total Users</p>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-sm text-green-600 mt-2">+12% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Documents Converted</p>
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold">45,678</p>
            <p className="text-sm text-green-600 mt-2">+8% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">Monthly Revenue</p>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold">$12,450</p>
            <p className="text-sm text-green-600 mt-2">+23% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600">System Health</p>
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">Healthy</p>
            <p className="text-sm text-gray-500 mt-2">All systems operational</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <p className="font-medium">Document conversion completed</p>
                  <p className="text-sm text-gray-500">User: user{i}@example.com</p>
                </div>
                <span className="text-sm text-gray-400">2 hours ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
