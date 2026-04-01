import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Plus, X, Search } from 'lucide-react'

export default function MedicineInput({ medicines, onChange }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [isRecording, setIsRecording] = useState(false)
  const [recognitionError, setRecognitionError] = useState(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const recognitionRef = useRef(null)

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return }
    try {
      const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(q)}`)
      if (res.ok) setSuggestions(await res.json())
    } catch {
      // Backend offline — filter from local empty array
      setSuggestions([])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchSuggestions(query), 200)
    return () => clearTimeout(timer)
  }, [query, fetchSuggestions])

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addMedicine = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (medicines.some(m => m.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...medicines, trimmed])
    setQuery('')
    setSuggestions([])
    setActiveIdx(-1)
    inputRef.current?.focus()
  }

  const removeMedicine = (idx) => {
    onChange(medicines.filter((_, i) => i !== idx))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        addMedicine(suggestions[activeIdx].brand.charAt(0).toUpperCase() + suggestions[activeIdx].brand.slice(1))
      } else if (query.trim()) {
        addMedicine(query)
      }
    }
    if (e.key === 'Escape') { setSuggestions([]); setActiveIdx(-1) }
  }

  // Voice input via Web Speech API
  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecognitionError('Voice input not supported in this browser. Use Chrome or Edge.')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 3

    recognition.onstart = () => { setIsRecording(true); setRecognitionError(null) }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = (e) => { setRecognitionError(`Voice error: ${e.error}`); setIsRecording(false) }
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      // Split on common delimiters (and, comma, plus)
      const meds = transcript.split(/\s*(?:and|,|\+|।)\s*/i).filter(Boolean)
      meds.forEach(m => addMedicine(m.trim()))
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Search size={16} className="text-[var(--text-muted)]" />
        <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Add Medicines
        </span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {medicines.length} added
        </span>
      </div>

      {/* Input row */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id="medicine-search-input"
            type="text"
            className="med-input pr-10"
            placeholder="Type brand or generic name (e.g. Ecosprin, Warfarin)…"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(-1) }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <div ref={dropdownRef} className="autocomplete-dropdown">
              {suggestions.map((s, i) => (
                <div
                  key={s.brand + i}
                  className={`autocomplete-item ${i === activeIdx ? 'active' : ''}`}
                  onMouseDown={() => addMedicine(s.brand.charAt(0).toUpperCase() + s.brand.slice(1))}
                >
                  <span className="brand">{s.brand.charAt(0).toUpperCase() + s.brand.slice(1)}</span>
                  <span className="generic">→ {s.generic} {s.dose ? `(${s.dose})` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add button */}
        <button
          id="add-medicine-btn"
          className="btn-secondary"
          onClick={() => query.trim() && addMedicine(query)}
          title="Add medicine"
        >
          <Plus size={16} />
          Add
        </button>

        {/* Voice button */}
        <button
          id="voice-input-btn"
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleVoice}
          title={isRecording ? 'Stop recording' : 'Speak medicine names'}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>

      {/* Voice error */}
      {recognitionError && (
        <p className="text-xs text-[var(--moderate)]">{recognitionError}</p>
      )}

      {/* Voice hint */}
      {isRecording && (
        <p className="text-xs text-[var(--critical)] animate-pulse">
          🎤 Listening… Say medicine names separated by "and" or pauses
        </p>
      )}

      {/* Medicine tags */}
      {medicines.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {medicines.map((med, i) => (
            <span key={i} className="med-tag slide-in">
              {med}
              <button
                onClick={() => removeMedicine(i)}
                title={`Remove ${med}`}
                aria-label={`Remove ${med}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Quick demo pills */}
      {medicines.length === 0 && (
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-2">Quick demo — try these:</p>
          <div className="flex flex-wrap gap-2">
            {['Ecosprin 75', 'Glycomet 500', 'Warf 2', 'Lasix 40', 'Telma 40', 'Atorva 40'].map(m => (
              <button
                key={m}
                className="text-xs py-1 px-3 rounded-full border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-glow)] hover:text-[var(--text-accent)] transition-all"
                onClick={() => addMedicine(m)}
              >
                + {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
