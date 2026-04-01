import { useState } from 'react'
import { Shield, AlertTriangle, Loader2, ChevronRight, RotateCcw } from 'lucide-react'
import MedicineInput from './components/MedicineInput'
import PatientProfile from './components/PatientProfile'
import InteractionReport from './components/InteractionReport'

const DEFAULT_PROFILE = {
  age: 65,
  weight: 65,
  conditions: [],
  allergies: [],
}

export default function App() {
  const [medicines, setMedicines] = useState([])
  const [patient, setPatient] = useState(DEFAULT_PROFILE)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheck = async () => {
    if (medicines.length === 0) {
      setError('Please add at least one medicine to check.')
      return
    }
    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicines, patient }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message === 'Failed to fetch'
        ? 'Cannot connect to the MedSafe API. Is the backend running on port 8000?'
        : e.message
      )
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMedicines([])
    setPatient(DEFAULT_PROFILE)
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[rgba(5,5,17,0.85)] backdrop-blur-2xl border-b border-[rgba(99,179,237,0.15)] shadow-lg shadow-blue-900/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] flex items-center justify-center shadow-[0_0_20px_rgba(0,210,255,0.4)]">
              <Shield size={20} className="text-white fill-white/20" />
            </div>
            <div>
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8c9baf] tracking-tight">
                MedSafe India
              </h1>
              <p className="text-[11px] text-[#00d2ff] font-semibold uppercase tracking-widest mt-0.5" style={{ textShadow: '0 0 10px rgba(0,210,255,0.3)' }}>
                Polypharmacy AI Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {result && (
              <button className="btn-secondary text-sm flex items-center gap-2" onClick={handleReset} id="reset-btn">
                <RotateCcw size={14} />
                New Analysis
              </button>
            )}
            <span className="text-xs font-medium px-3 py-1 rounded-full border border-[var(--border-dim)] text-[var(--text-muted)] hidden sm:block">
              Free · Offline Mode · Indic Context
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero (only when no result) ── */}
      {!result && !loading && (
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(0,210,255,0.05)] border border-[rgba(0,210,255,0.2)] text-xs text-[#00d2ff] font-bold tracking-wide uppercase mb-8 shadow-[0_0_15px_rgba(0,210,255,0.1)]">
            <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-pulse shadow-[0_0_8px_#00d2ff]" />
            AI-powered · 100+ Indian brands
          </div>
          
          <h2 className="text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
            Know if your medicines are <br />
            <span className="text-gradient drop-shadow-[0_0_20px_rgba(0,210,255,0.3)]">safe together.</span>
          </h2>
          
          <p className="text-[#8c9baf] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            India's first polypharmacy checker understanding local brand names. 
            We check 5 dimensions of medical interactions and explain risks in plain Hindi and English.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            {[
              '💊 Drug–Drug', '🏥 Drug–Disease', '🔁 Duplicates',
              '⚖️ Dosage Limits', '🥗 Food Conflicts', '🗣️ Hindi AI'
            ].map(f => (
              <span key={f} className="text-[13px] font-semibold px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-[#00d2ff]/40 transition-all cursor-default shadow-sm">
                {f}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Main content ── */}
      <main className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
        {!result ? (
          /* Input layout */
          <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto animate-enter">
            {/* Medicine input panel */}
            <div className="lg:col-span-3 glass-panel p-8 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <MedicineInput medicines={medicines} onChange={setMedicines} />

              {/* Error */}
              {error && (
                <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-200">{error}</p>
                </div>
              )}

              {/* Check button */}
              <button
                id="check-medicines-btn"
                className="btn-glow w-full flex items-center justify-center gap-2 text-lg"
                onClick={handleCheck}
                disabled={loading || medicines.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Analyzing {medicines.length} medicines…
                  </>
                ) : (
                  <>
                    Run Deep Safety Check
                    <ChevronRight size={20} />
                  </>
                )}
              </button>

              {medicines.length > 0 && !loading && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#8c9baf]">
                  <div className="w-2 h-2 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]"></div>
                  {medicines.length} medicine{medicines.length > 1 ? 's' : ''} loaded · 
                  Patient Age: {patient.age}
                </div>
              )}
            </div>

            {/* Patient profile panel */}
            <div className="lg:col-span-2 glass-panel p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <PatientProfile profile={patient} onChange={setPatient} />
            </div>
          </div>
        ) : (
          /* Results layout */
          <div className="grid lg:grid-cols-5 gap-8 animate-enter">
            {/* Sidebar — patient + medicines */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-panel p-6 shadow-xl">
                <p className="text-[11px] text-[#00d2ff] uppercase tracking-widest font-bold mb-4">Checked Medicines</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {medicines.map((m, i) => (
                    <span key={i} className="cyber-tag">{m}</span>
                  ))}
                </div>
                <div className="border-t border-[var(--border-dim)] pt-4 space-y-2 text-[#8c9baf] font-medium text-sm">
                  <div className="flex justify-between"><span>Age</span> <span className="text-white">{patient.age} years{patient.age >= 65 ? ' (Elderly)' : ''}</span></div>
                  <div className="flex justify-between"><span>Weight</span> <span className="text-white">{patient.weight} kg</span></div>
                  {patient.conditions.length > 0 && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-[var(--border-dim)]">
                      <span>Conditions</span> 
                      <span className="text-white text-right ml-4">{patient.conditions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel p-6 shadow-xl">
                <PatientProfile profile={patient} onChange={setPatient} />
                <button
                  className="btn-glow w-full mt-6 text-sm"
                  onClick={handleCheck}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Re-Run Analysis'}
                </button>
              </div>
            </div>

            {/* Report */}
            <div className="lg:col-span-3">
              <InteractionReport result={result} medicines={medicines} patient={patient} />
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="mt-10 text-center space-y-4">
            <div className="relative inline-block">
              <Loader2 size={40} className="animate-spin text-[var(--text-accent)]" />
            </div>
            <div className="space-y-1">
              <p className="text-[var(--text-primary)] font-semibold">Analyzing {medicines.length} medicines…</p>
              <p className="text-sm text-[var(--text-muted)]">Running 5 safety checks · Getting Hindi explanations</p>
            </div>
            {/* Skeleton */}
            <div className="max-w-2xl mx-auto space-y-3 mt-6">
              {[1, 0.85, 0.7].map((w, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" style={{ width: `${w * 100}%`, margin: '0 auto' }} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] py-6 text-center">
        <p className="text-xs text-[var(--text-muted)]">
          ⚕️ MedSafe India · For informational purposes only · Always consult your doctor
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1 opacity-50">
          Powered by OpenFDA · facebook/nllb-200 · Local LM Studio
        </p>
      </footer>
    </div>
  )
}
