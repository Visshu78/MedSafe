import { User, Activity } from 'lucide-react'

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'CKD', 'Asthma', 'CAD',
  'GERD', 'Gout', 'Heart Failure', 'Liver Disease', 'Arthritis',
]

const CONDITION_ICONS = {
  Diabetes: '🩸', Hypertension: '💊', CKD: '🫘', Asthma: '🫁', CAD: '❤️',
  GERD: '🔥', Gout: '🦴', 'Heart Failure': '💔', 'Liver Disease': '🫀', Arthritis: '🦵',
}

export default function PatientProfile({ profile, onChange }) {
  const update = (key, val) => onChange({ ...profile, [key]: val })

  const toggleCondition = (c) => {
    const exists = profile.conditions.includes(c)
    update('conditions', exists
      ? profile.conditions.filter(x => x !== c)
      : [...profile.conditions, c]
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <User size={16} className="text-[var(--text-muted)]" />
        <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Patient Profile
        </span>
      </div>

      {/* Age + Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="patient-age" className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
            Age (years)
          </label>
          <input
            id="patient-age"
            type="number"
            min="1" max="120"
            className="med-input text-center"
            value={profile.age}
            onChange={e => update('age', parseInt(e.target.value) || 0)}
          />
          {profile.age >= 65 && (
            <p className="text-xs text-[var(--moderate)] mt-1">⚠️ Elderly — reduced dosing thresholds active</p>
          )}
        </div>
        <div>
          <label htmlFor="patient-weight" className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">
            Weight (kg)
          </label>
          <input
            id="patient-weight"
            type="number"
            min="1" max="300"
            className="med-input text-center"
            value={profile.weight}
            onChange={e => update('weight', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity size={14} className="text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
            Existing Conditions
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => (
            <button
              key={c}
              id={`condition-${c.toLowerCase().replace(/\s+/g, '-')}`}
              className={`condition-pill ${profile.conditions.includes(c) ? 'selected' : 'unselected'}`}
              onClick={() => toggleCondition(c)}
            >
              <span>{CONDITION_ICONS[c] || '⚕️'}</span>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Selected summary */}
      {profile.conditions.length > 0 && (
        <p className="text-xs text-[var(--text-accent)]">
          ✓ {profile.conditions.length} condition{profile.conditions.length > 1 ? 's' : ''} selected — drug-disease checks active
        </p>
      )}
    </div>
  )
}
