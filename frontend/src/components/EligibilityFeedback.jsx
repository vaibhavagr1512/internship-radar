import { DEGREE_LABELS } from './StudentEligibilityForm.jsx'
const LABELS = {
  MATCHES: 'Matches listed requirements',
  DOES_NOT_MATCH: 'Doesn’t match listed requirements',
  CHECK_OFFICIAL: 'Check official requirements',
}
export default function EligibilityFeedback({ assessment }) {
  if (!assessment) return null
  const label = LABELS[assessment.status] || LABELS.CHECK_OFFICIAL
  return (
    <div
      className={`eligibility-feedback eligibility-${assessment.status?.toLowerCase()}`}
    >
      <strong>{label}</strong>
      {assessment.reasons?.map((reason) => (
        <p key={reason}>{reason}</p>
      ))}
      {assessment.verified &&
        assessment.degrees?.length > 0 &&
        assessment.studyYears?.length > 0 && (
          <p className="recorded-criteria">
            Recorded criteria:{' '}
            {assessment.degrees
              .map((degree) => DEGREE_LABELS[degree] || degree)
              .join(', ')}{' '}
            · Years {assessment.studyYears.join(', ')} ·{' '}
            {assessment.minimumCgpa == null
              ? 'No minimum CGPA'
              : `Minimum CGPA ${assessment.minimumCgpa}/10`}
          </p>
        )}
    </div>
  )
}
