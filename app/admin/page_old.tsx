'use client'

import { useState, useEffect } from 'react'

interface Shipment {
  shipment_id: string
  status: string
  eta_ts: string
  address_text: string
  address_text_ar?: string
  geo_lat: number
  geo_lng: number
  risk_tier: string
}

interface EvidencePacket {
  evidence_id: string
  shipment_id: string
  action_type: string
  trust_method: string
  policy_snapshot: string
  before_state: string
  system_writes: string
  after_state: string
  created_at: string
  shipment?: {
    shipment_id: string
    status: string
  }
}

interface ShipmentNote {
  id: string
  shipment_id: string
  note_type: string
  content: string
  captured_at: string
  resolved: boolean
  shipment?: {
    shipment_id: string
    status: string
  }
}

interface PolicyConfig {
  id: number
  reschedule_cutoff_minutes: number
  max_geo_move_meters: number
  trust_threshold_location: number
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'evidence' | 'policy' | 'notes'>('shipments')
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Shipments state
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [statusFilter, setStatusFilter] = useState('all')

  // Evidence state
  const [evidence, setEvidence] = useState<EvidencePacket[]>([])
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)

  // Policy state
  const [policyConfig, setPolicyConfig] = useState<PolicyConfig | null>(null)
  const [cutoffMinutes, setCutoffMinutes] = useState(120)
  const [maxGeoMeters, setMaxGeoMeters] = useState(250)

  // Notes state
  const [notes, setNotes] = useState<ShipmentNote[]>([])
  const [notesFilter, setNotesFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')

  useEffect(() => {
    if (isAuthenticated) {
      fetchShipments()
      fetchEvidence()
      fetchPolicy()
      fetchNotes()
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Simple demo password - in production use real auth
    if (password === 'admin123' || password === 'demo') {
      setIsAuthenticated(true)
    } else {
      alert('Invalid password. Try: admin123 or demo')
    }
  }

  const fetchShipments = async () => {
    try {
      const url = statusFilter !== 'all'
        ? `/api/admin/shipments?status=${statusFilter}`
        : '/api/admin/shipments'
      const res = await fetch(url)
      const data = await res.json()
      setShipments(data.shipments || [])
    } catch (error) {
      console.error('Failed to fetch shipments:', error)
    }
  }

  const fetchEvidence = async () => {
    try {
      const res = await fetch('/api/admin/evidence')
      const data = await res.json()
      setEvidence(data.evidence || [])
    } catch (error) {
      console.error('Failed to fetch evidence:', error)
    }
  }

  const fetchPolicy = async () => {
    try {
      const res = await fetch('/api/admin/policy')
      const data = await res.json()
      if (data.config) {
        setPolicyConfig(data.config)
        setCutoffMinutes(data.config.reschedule_cutoff_minutes)
        setMaxGeoMeters(data.config.max_geo_move_meters)
      }
    } catch (error) {
      console.error('Failed to fetch policy:', error)
    }
  }

  const fetchNotes = async () => {
    try {
      const url = notesFilter === 'all'
        ? '/api/admin/notes'
        : `/api/admin/notes?resolved=${notesFilter === 'resolved'}`
      const res = await fetch(url)
      const data = await res.json()
      setNotes(data.notes || [])
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    }
  }

  const updatePolicy = async () => {
    try {
      const res = await fetch('/api/admin/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reschedule_cutoff_minutes: cutoffMinutes,
          max_geo_move_meters: maxGeoMeters,
        }),
      })
      const data = await res.json()
      setPolicyConfig(data.config)
      alert('Policy updated successfully')
    } catch (error) {
      console.error('Failed to update policy:', error)
      alert('Failed to update policy')
    }
  }

  const toggleNoteResolved = async (id: string, currentResolved: boolean) => {
    try {
      await fetch('/api/admin/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved: !currentResolved }),
      })
      fetchNotes()
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'shipments') {
      fetchShipments()
    }
  }, [statusFilter])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'notes') {
      fetchNotes()
    }
  }, [notesFilter])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Panel Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Demo password: admin123 or demo
            </p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">SAM v2 - Admin Panel</h1>
            <p className="text-sm opacity-90">Resolution Engine Operations</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-white/20 rounded hover:bg-white/30 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-8 px-4">
            {(['shipments', 'evidence', 'policy', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium capitalize transition ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'shipments' && '📦 Shipments'}
                {tab === 'evidence' && '📋 Evidence Ledger'}
                {tab === 'policy' && '⚙️ Policy Controls'}
                {tab === 'notes' && '📝 Customer Notes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Shipments Tab */}
        {activeTab === 'shipments' && (
          <div>
            <div className="mb-4 flex items-center space-x-4">
              <label className="font-medium">Filter by status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipment ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ETA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Tier
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shipments.map((shipment) => (
                    <tr key={shipment.shipment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {shipment.shipment_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          shipment.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {shipment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(shipment.eta_ts).toLocaleString('en-US')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {shipment.address_text_ar || shipment.address_text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          shipment.risk_tier === 'high' ? 'bg-red-100 text-red-800' :
                          shipment.risk_tier === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {shipment.risk_tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shipments.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No shipments found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div>
            <div className="space-y-4">
              {evidence.map((packet) => (
                <div key={packet.evidence_id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-mono text-sm text-gray-500">{packet.evidence_id}</p>
                      <p className="text-lg font-semibold mt-1">
                        {packet.action_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        Shipment: {packet.shipment_id} • {new Date(packet.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedEvidence(
                        expandedEvidence === packet.evidence_id ? null : packet.evidence_id
                      )}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    >
                      {expandedEvidence === packet.evidence_id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {expandedEvidence === packet.evidence_id && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <h4 className="font-semibold mb-2">Trust Method</h4>
                        <p className="text-sm bg-gray-50 p-2 rounded">{packet.trust_method}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Policy Snapshot</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                          {JSON.stringify(JSON.parse(packet.policy_snapshot), null, 2)}
                        </pre>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Before State</h4>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                            {JSON.stringify(JSON.parse(packet.before_state), null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">After State</h4>
                          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                            {JSON.stringify(JSON.parse(packet.after_state), null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">System Writes</h4>
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                          {JSON.stringify(JSON.parse(packet.system_writes), null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {evidence.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No evidence packets found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Policy Tab */}
        {activeTab === 'policy' && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-xl font-bold mb-6">Policy Configuration</h2>

            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-2">
                  Reschedule Cutoff (minutes before ETA)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="10"
                    value={cutoffMinutes}
                    onChange={(e) => setCutoffMinutes(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-mono text-lg w-16 text-right">{cutoffMinutes}</span>
                  <span className="text-gray-500">min</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Customers cannot reschedule within this time window before ETA
                </p>
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Maximum Location Move Radius (meters)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={maxGeoMeters}
                    onChange={(e) => setMaxGeoMeters(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-mono text-lg w-16 text-right">{maxGeoMeters}</span>
                  <span className="text-gray-500">m</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Location updates exceeding this radius will be denied
                </p>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={updatePolicy}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Save Policy Changes
                </button>
              </div>

              {policyConfig && (
                <div className="text-sm text-gray-500 mt-4">
                  <p>Current policy trust threshold: {policyConfig.trust_threshold_location}</p>
                  <p className="text-xs mt-1">Policy ID: {policyConfig.id}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <div className="mb-4 flex items-center space-x-4">
              <label className="font-medium">Filter:</label>
              <div className="flex space-x-2">
                {(['all', 'unresolved', 'resolved'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setNotesFilter(filter)}
                    className={`px-4 py-2 rounded-lg capitalize transition ${
                      notesFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white rounded-lg shadow p-6 ${
                    note.resolved ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-sm text-gray-500">{note.shipment_id}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          note.note_type === 'out_of_scope' ? 'bg-yellow-100 text-yellow-800' :
                          note.note_type === 'customer_question' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {note.note_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-gray-900 mb-2">{note.content}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(note.captured_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleNoteResolved(note.id, note.resolved)}
                      className={`ml-4 px-4 py-2 rounded transition ${
                        note.resolved
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {note.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                    </button>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No customer notes found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
