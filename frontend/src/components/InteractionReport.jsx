import { useState } from 'react'
import { ChevronDown, ChevronUp, Share2, Download, AlertTriangle, Info } from 'lucide-react'
import { jsPDF } from 'jspdf'

/* ─── Severity config ──────────────────────────────────────── */
const SEV = {
  critical:  { label: 'Critical',  icon: '🔴', cls: 'critical',  badge: 'badge-critical',  pulseCls: 'bg-red-500' },
  moderate:  { label: 'Moderate',  icon: '🟡', cls: 'moderate',  badge: 'badge-moderate',  pulseCls: 'bg-yellow-500' },
  low:       { label: 'Low Risk',  icon: '🟢', cls: 'low',       badge: 'badge-low',       pulseCls: 'bg-green-500' },
  duplicate: { label: 'Duplicate', icon: '🟣', cls: 'duplicate', badge: 'badge-duplicate', pulseCls: 'bg-purple-500' },
  food:      { label: 'Food',      icon: '🍊', cls: 'food',      badge: 'badge-food',       pulseCls: 'bg-pink-400' },
}

const TYPE_LABELS = {
  ddi:          'Drug–Drug',
  drug_disease: 'Drug–Disease',
  duplicate:    'Duplicate Therapy',
  dosage:       'Dosage Alert',
  food:         'Food Interaction',
}

/* ─── Single finding card ──────────────────────────────────── */
function FindingCard({ finding, index }) {
  const [expanded, setExpanded] = useState(index < 2)  // first 2 auto-open
  const [showHindi, setShowHindi] = useState(false)

  const sev = SEV[finding.type === 'duplicate' ? 'duplicate'
    : finding.type === 'food' ? 'food'
    : finding.severity] || SEV.low

  const typeLabel = TYPE_LABELS[finding.type] || finding.type

  const title = finding.type === 'ddi'
    ? finding.drugs?.join(' + ')
    : finding.type === 'drug_disease'
    ? `${finding.drug} × ${finding.condition}`
    : finding.type === 'duplicate'
    ? finding.drugs?.join(' + ')
    : finding.type === 'food'
    ? `${finding.drug} × ${finding.food}`
    : finding.drug || 'Alert'

  const boxClass = finding.type === 'duplicate' ? 'dup-box'
    : finding.type === 'food' ? 'food-box'
    : finding.severity === 'critical' ? 'crit-box'
    : finding.severity === 'moderate' ? 'mdrt-box'
    : 'safe-box';

  return (
    <div
      className={`finding-box ${boxClass} slide-in`}
      style={{ animationDelay: `${index * 0.06}s` }}
      id={`finding-card-${index}`}
    >
      {/* Header row */}
      <div
        className="flex items-start justify-between gap-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0 drop-shadow-md">{sev.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`badge ${sev.badge}`}>{sev.label}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                {typeLabel}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
              {title}
            </p>
          </div>
        </div>
        <button className="text-[var(--text-muted)] flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 space-y-3 pl-8">
          {/* English explanation */}
          <div className="p-3 rounded-lg bg-black/20 text-sm leading-relaxed text-[var(--text-primary)]">
            {finding.english_explanation}
          </div>

          {/* Action box */}
          {finding.action && (
            <div className="flex gap-2 p-3 rounded-lg bg-black/30 border border-[var(--border)]">
              <Info size={14} className="text-[var(--text-accent)] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                <strong className="text-[var(--text-accent)]">Action: </strong>
                {finding.action}
              </p>
            </div>
          )}

          {/* Hindi toggle */}
          {finding.hindi_explanation && (
            <div>
              <button
                className="text-xs text-[var(--text-accent)] underline underline-offset-2 mb-2"
                onClick={() => setShowHindi(h => !h)}
              >
                {showHindi ? 'Hide Hindi / हिंदी छुपाएं' : 'Show in Hindi / हिंदी में देखें'}
              </button>
              {showHindi && (
                <div className="p-3 rounded-lg bg-black/20 border border-[var(--border)]">
                  <p className="hindi text-[var(--text-primary)]">{finding.hindi_explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Food specific */}
          {finding.type === 'food' && finding.hindi_food && (
            <p className="text-xs text-[var(--text-muted)]">
              🇮🇳 Indian names: <span className="hindi">{finding.hindi_food}</span>
            </p>
          )}

          {/* Dosage specific */}
          {finding.type === 'dosage' && finding.prescribed_mg && (
            <div className="flex gap-4 text-xs">
              <span className="text-[var(--moderate)]">Prescribed: <strong>{finding.prescribed_mg}mg</strong></span>
              <span className="text-[var(--safe)]">Recommended max: <strong>{finding.recommended_max_mg}mg</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Filter bar ───────────────────────────────────────────── */
const FILTERS = ['All', 'Critical', 'Moderate', 'Drug–Drug', 'Drug–Disease', 'Duplicate', 'Food', 'Dosage']

/* ─── PDF generator ────────────────────────────────────────── */
function generatePDF(result, medicines, patient) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.setTextColor(30, 60, 120)
  doc.text('MedSafe India — Medication Safety Report', 14, 20)

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 28)
  doc.text(`Patient: Age ${patient.age} yrs | Weight ${patient.weight} kg | Conditions: ${patient.conditions.join(', ') || 'None'}`, 14, 34)
  doc.text(`Medicines checked: ${medicines.join(', ')}`, 14, 40)

  doc.setDrawColor(200, 200, 200)
  doc.line(14, 44, 196, 44)

  let y = 52
  const { findings, summary } = result

  doc.setFontSize(12)
  doc.setTextColor(200, 50, 50)
  doc.text(`⚠ Critical: ${summary.critical}   Moderate: ${summary.moderate}   Total: ${summary.total}`, 14, y)
  y += 12

  findings.forEach((f, i) => {
    if (y > 270) { doc.addPage(); y = 20 }
    const sev = f.severity || 'low'
    const colors = { critical: [220, 38, 38], moderate: [200, 100, 0], low: [22, 160, 80] }
    const [r, g, b] = colors[sev] || colors.low
    doc.setFontSize(9)
    doc.setTextColor(r, g, b)
    doc.text(`[${(sev).toUpperCase()}] ${TYPE_LABELS[f.type] || f.type}`, 14, y)
    y += 5
    doc.setTextColor(40, 40, 40)
    const lines = doc.splitTextToSize(f.english_explanation || '', 180)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 4
    if (f.action) {
      doc.setTextColor(60, 100, 180)
      const alines = doc.splitTextToSize(`→ ${f.action}`, 180)
      doc.text(alines, 14, y)
      y += alines.length * 5 + 8
    }
  })

  doc.save('MedSafe-India-Report.pdf')
}

/* ─── WhatsApp share ───────────────────────────────────────── */
function buildWhatsAppText(result, medicines, patient) {
  const { summary, findings } = result
  let text = `🏥 *MedSafe India — Medication Safety Report*\n\n`
  text += `👤 Patient: Age ${patient.age} yrs | Conditions: ${patient.conditions.join(', ') || 'None'}\n`
  text += `💊 Medicines: ${medicines.join(', ')}\n\n`
  text += `📊 *Summary:* ${summary.critical} Critical | ${summary.moderate} Moderate | ${summary.total} Total\n\n`

  const critical = findings.filter(f => f.severity === 'critical').slice(0, 5)
  if (critical.length) {
    text += `🔴 *CRITICAL ALERTS*\n`
    critical.forEach(f => { text += `• ${f.english_explanation}\n` })
    text += '\n'
  }

  text += `_Full report generated by MedSafe India_`
  return encodeURIComponent(text)
}

/* ─── Main InteractionReport component ────────────────────── */
export default function InteractionReport({ result, medicines, patient }) {
  const [filter, setFilter] = useState('All')
  const { findings, summary, normalized } = result

  const filtered = findings.filter(f => {
    if (filter === 'All') return true
    if (filter === 'Critical') return f.severity === 'critical'
    if (filter === 'Moderate') return f.severity === 'moderate'
    if (filter === 'Drug–Drug') return f.type === 'ddi'
    if (filter === 'Drug–Disease') return f.type === 'drug_disease'
    if (filter === 'Duplicate') return f.type === 'duplicate'
    if (filter === 'Food') return f.type === 'food'
    if (filter === 'Dosage') return f.type === 'dosage'
    return true
  })

  const waText = buildWhatsAppText(result, medicines, patient)

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="glass-panel p-6 shadow-xl relative overflow-hidden">
        {summary.critical > 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl" />}
        <h2 className="text-[12px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] uppercase tracking-widest mb-6">
          Safety Summary — {summary.medicines_checked} medicines checked
        </h2>
        <div className="summary-strip">
          {[
            { label: 'Critical', val: summary.critical, bg: 'rgba(255, 46, 99, 0.1)', border: 'rgba(255, 46, 99, 0.4)', color: 'var(--crit-hex)' },
            { label: 'Moderate', val: summary.moderate, bg: 'rgba(255, 184, 48, 0.1)', border: 'rgba(255, 184, 48, 0.4)', color: 'var(--mdrt-hex)' },
            { label: 'DDI', val: summary.ddi, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', color: 'var(--text-main)' },
            { label: 'Disease', val: summary.drug_disease, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', color: 'var(--text-main)' },
            { label: 'Duplicates', val: summary.duplicates, bg: 'rgba(157, 78, 221, 0.1)', border: 'rgba(157, 78, 221, 0.4)', color: 'var(--dup-hex)' },
            { label: 'Food', val: summary.food, bg: 'rgba(247, 37, 133, 0.1)', border: 'rgba(247, 37, 133, 0.4)', color: 'var(--food-hex)' },
            { label: 'Dosage', val: summary.dosage, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', color: 'var(--text-main)' },
          ].map(({ label, val, bg, border, color }) => (
            <div key={label} className="summary-pill shadow-[0_4px_15px_rgba(0,0,0,0.2)]" style={{ background: bg, borderColor: border, color }}>
              {val}
              <span style={{ color, opacity: 0.9 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Critical warning banner */}
        {summary.critical > 0 && (
          <div className="mt-6 flex gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <AlertTriangle size={20} className="text-[#ff2e63] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-100 font-medium">
              <strong className="text-[#ff2e63] text-base">{summary.critical} critical interaction{summary.critical > 1 ? 's' : ''} detected.</strong>{' '}
              <br/>Show this report to your doctor immediately. DO NOT take these together without approval.
            </p>
          </div>
        )}

        {/* Normalized medicines */}
        <details className="mt-4">
          <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-accent)] transition-colors">
            View brand → generic mapping
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {normalized.map((m, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-lg bg-black/30 text-[var(--text-muted)]">
                {m.input} → <span className="text-[var(--text-accent)]">{m.generic}</span>
                {m.confidence < 100 && m.matched_brand && (
                  <span className="opacity-60"> ({m.confidence}%)</span>
                )}
              </span>
            ))}
          </div>
        </details>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          id="download-pdf-btn"
          className="btn-secondary"
          onClick={() => generatePDF(result, medicines, patient)}
        >
          <Download size={14} />
          Download PDF
        </button>
        <a
          id="whatsapp-share-btn"
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', textDecoration: 'none' }}
        >
          <Share2 size={14} />
          Share on WhatsApp
        </a>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
              filter === f
                ? 'bg-[var(--text-accent)] text-[var(--bg-deep)] border-transparent'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-glow)]'
            }`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-1 opacity-60">
                ({f === 'Critical' ? summary.critical
                  : f === 'Moderate' ? summary.moderate
                  : f === 'Drug–Drug' ? summary.ddi
                  : f === 'Drug–Disease' ? summary.drug_disease
                  : f === 'Duplicate' ? summary.duplicates
                  : f === 'Food' ? summary.food
                  : f === 'Dosage' ? summary.dosage : 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Findings */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-panel p-10 text-center shadow-xl">
            <p className="text-4xl mb-3 drop-shadow-[0_0_10px_rgba(0,210,255,0.5)]">✨</p>
            <p className="text-[var(--text-main)] text-xl font-bold tracking-tight">No issues in this category</p>
            <p className="text-sm text-[var(--text-muted)] mt-2 font-medium">Switch filter to see all findings</p>
          </div>
        ) : (
          filtered.map((f, i) => <FindingCard key={i} finding={f} index={i} />)
        )}
      </div>

      {findings.length === 0 && (
        <div className="glass-panel p-12 text-center shadow-[0_0_50px_rgba(0,210,255,0.1)] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#00d2ff]/10 rounded-full blur-3xl pointer-events-none"></div>
          <p className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]">🟢</p>
          <p className="text-2xl font-black text-[#00d2ff] mb-2 tracking-tight">System Clear</p>
          <p className="text-md text-[#8c9baf] font-medium max-w-lg mx-auto leading-relaxed">
            No known drug interactions found for this combination in our database. <br/>
            Always consult your doctor for the final decision.
          </p>
        </div>
      )}
    </div>
  )
}
