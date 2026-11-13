import { useState } from 'react'
import { GraduationCap } from 'lucide-react'

export const DEGREE_LABELS = {
  BTECH: 'B.Tech',
  BE: 'B.E.',
  BSC: 'B.Sc.',
  BCA: 'BCA',
  MTECH: 'M.Tech',
  MCA: 'MCA',
  MSC: 'M.Sc.',
  OTHER: 'Other',
}

export default function StudentEligibilityForm({
  profile,
  matchesOnly,
  onApply,
  onClear,
  onMatchesChange,
}) {
  const [degree, setDegree] = useState(profile?.degree ?? '')
  const [year, setYear] = useState(String(profile?.year ?? 3))
  const [cgpa, setCgpa] = useState(String(profile?.cgpa ?? ''))
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    const score = Number(cgpa)
    if (
      !degree ||
      cgpa.trim() === '' ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > 10 ||
      !/^\d+(\.\d{1,2})?$/.test(cgpa.trim())
    ) {
      setError(
        'Choose a degree and enter CGPA from 0 to 10 with up to two decimal places.',
      )
      return
    }
    setError('')
    onApply({ degree, year: Number(year), cgpa: cgpa.trim() })
  }
  function clear() {
    setDegree('')
    setYear('3')
    setCgpa('')
    setError('')
    onClear()
  }
  return (
    <section
      className="student-profile"
      aria-labelledby="student-profile-heading"
    >
      <div className="filters-title">
        <GraduationCap size={17} aria-hidden="true" />
        <h3 id="student-profile-heading">Check recorded eligibility</h3>
      </div>
      <p>
        Enter your degree, study year and CGPA. Missing or unverified
        requirements always need an official check.
      </p>
      <form className="student-profile-fields" onSubmit={submit}>
        <label htmlFor="student-degree">
          Your degree
          <select
            id="student-degree"
            value={degree}
            required
            onChange={(event) => setDegree(event.target.value)}
          >
            <option value="">Select degree</option>
            {Object.entries(DEGREE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="student-year">
          Study year
          <select
            id="student-year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          >
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <option key={value} value={value}>
                Year {value}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="student-cgpa">
          Your CGPA (out of 10)
          <input
            id="student-cgpa"
            type="number"
            min="0"
            max="10"
            step="0.01"
            required
            value={cgpa}
            onChange={(event) => setCgpa(event.target.value)}
            placeholder="e.g. 8.25"
          />
        </label>
        <button className="primary-button" type="submit">
          Apply profile
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={!profile && !degree && !cgpa}
          onClick={clear}
        >
          Clear profile
        </button>
      </form>
      {error && (
        <p className="profile-error" role="alert">
          {error}
        </p>
      )}
      {profile && (
        <p className="applied-profile">
          Applied profile: {DEGREE_LABELS[profile.degree]} · Year {profile.year}{' '}
          · CGPA {profile.cgpa}/10
        </p>
      )}
      <label className="matching-toggle">
        <input
          type="checkbox"
          checked={matchesOnly}
          disabled={!profile}
          onChange={(event) => onMatchesChange(event.target.checked)}
        />
        Show matches only
      </label>
      <p className="profile-footnote">
        Your profile is used for this page only and is not saved. A match checks
        recorded criteria, not acceptance or every condition on the official
        listing. Demo criteria are illustrative.
      </p>
    </section>
  )
}
