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

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [statusFilter, setStatusFilter] = useState('all')

  const [evidence, setEvidence] = useState<EvidencePacket[]>([])
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null)

  const [policyConfig, setPolicyConfig] = useState<PolicyConfig | null>(null)
  const [cutoffMinutes, setCutoffMinutes] = useState(120)
  const [maxGeoMeters, setMaxGeoMeters] = useState(250)

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">SAM v2 Admin</h1>
            <p className="text-blue-300 text-sm">Resolution Engine Control Panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter admin password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-xl hover:shadow-lg hover:shadow-teal-500/50 transition font-semibold"
            >
              Login to Dashboard
            </button>
            <p className="text-xs text-gray-400 text-center">
              Demo password: <span className="text-teal-300">admin123</span> or <span className="text-teal-300">demo</span>
            </p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/60 backdrop-blur-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">SAM v2 Admin Panel</h1>
            <p className="text-sm text-blue-300">Resolution Engine Operations Dashboard</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/40 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {(['shipments', 'evidence', 'policy', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 font-medium capitalize transition relative ${
                  activeTab === tab
                    ? 'text-teal-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'shipments' && '📦 Shipments'}
                {tab === 'evidence' && '📋 Evidence Ledger'}
                {tab === 'policy' && '⚙️ Policy Controls'}
                {tab === 'notes' && '📝 Customer Notes'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Shipments Tab */}
        {activeTab === 'shipments' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <label className="text-white font-medium">Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-slate-800/60 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Shipments</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="grid gap-4">
              {shipments.map((shipment) => (
                <div key={shipment.shipment_id} className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-6 hover:border-teal-500/50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <p className="font-mono text-lg text-white font-semibold">{shipment.shipment_id}</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          shipment.status === 'DELIVERED' ? 'bg-green-500/20 text-green-300' :
                          shipment.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {shipment.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          shipment.risk_tier === 'high' ? 'bg-red-500/20 text-red-300' :
                          shipment.risk_tier === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {shipment.risk_tier} risk
                        </span>
                      </div>
                      <p className="text-gray-300 arabic-text mb-2">{shipment.address_text_ar || shipment.address_text}</p>
                      <p className="text-sm text-gray-400">ETA: {new Date(shipment.eta_ts).toLocaleString('en-US')}</p>
                    </div>
                  </div>
                </div>
              ))}
              {shipments.length === 0 && (
                <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-12 text-center">
                  <p className="text-gray-400">No shipments found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            {evidence.map((packet) => (
              <div key={packet.evidence_id} className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-mono text-sm text-gray-400">{packet.evidence_id}</p>
                    <p className="text-lg font-semibold text-white mt-1">
                      {packet.action_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Shipment: {packet.shipment_id} • {new Date(packet.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedEvidence(
                      expandedEvidence === packet.evidence_id ? null : packet.evidence_id
                    )}
                    className="px-4 py-2 bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 transition"
                  >
                    {expandedEvidence === packet.evidence_id ? 'Hide' : 'View'} Details
                  </button>
                </div>

                {expandedEvidence === packet.evidence_id && (
                  <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Policy Snapshot</h4>
                      <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-x-auto text-gray-300">
                        {JSON.stringify(JSON.parse(packet.policy_snapshot), null, 2)}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Before State</h4>
                        <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto text-gray-300">
                          {JSON.stringify(JSON.parse(packet.before_state), null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">After State</h4>
                        <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto text-gray-300">
                          {JSON.stringify(JSON.parse(packet.after_state), null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {evidence.length === 0 && (
              <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-12 text-center">
                <p className="text-gray-400">No evidence packets found</p>
              </div>
            )}
          </div>
        )}

        {/* Policy Tab */}
        {activeTab === 'policy' && (
          <div className="max-w-2xl bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Policy Configuration</h2>

            <div className="space-y-8">
              <div>
                <label className="block text-white font-medium mb-3">
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
                    className="flex-1 accent-teal-500"
                  />
                  <span className="font-mono text-2xl text-teal-300 w-20 text-right">{cutoffMinutes}</span>
                  <span className="text-gray-400">min</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Customers cannot reschedule within this window
                </p>
              </div>

              <div>
                <label className="block text-white font-medium mb-3">
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
                    className="flex-1 accent-teal-500"
                  />
                  <span className="font-mono text-2xl text-teal-300 w-20 text-right">{maxGeoMeters}</span>
                  <span className="text-gray-400">m</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Location updates beyond this radius will be denied
                </p>
              </div>

              <div className="pt-6 border-t border-slate-700">
                <button
                  onClick={updatePolicy}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 rounded-xl hover:shadow-lg hover:shadow-teal-500/50 transition font-semibold text-lg"
                >
                  Save Policy Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <label className="text-white font-medium">Filter:</label>
              <div className="flex space-x-2">
                {(['all', 'unresolved', 'resolved'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setNotesFilter(filter)}
                    className={`px-4 py-2 rounded-lg capitalize transition ${
                      notesFilter === filter
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white'
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-6 ${
                    note.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="font-mono text-sm text-gray-400">{note.shipment_id}</span>
                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                          note.note_type === 'out_of_scope' ? 'bg-yellow-500/20 text-yellow-300' :
                          note.note_type === 'customer_question' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {note.note_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-white mb-2 leading-relaxed">{note.content}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(note.captured_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleNoteResolved(note.id, note.resolved)}
                      className={`ml-4 px-4 py-2 rounded-lg transition font-semibold ${
                        note.resolved
                          ? 'bg-slate-600/50 text-gray-300 hover:bg-slate-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50'
                      }`}
                    >
                      {note.resolved ? 'Unresolve' : 'Resolve'}
                    </button>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-12 text-center">
                  <p className="text-gray-400">No customer notes found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
