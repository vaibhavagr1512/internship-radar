import { RotateCcw, SlidersHorizontal } from 'lucide-react'

const label = (value) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())

export default function InternshipFilters({
  filters,
  options,
  loading,
  error,
  canClear,
  onChange,
  onClear,
  onRetry,
}) {
  return (
    <div className="discovery-filters" aria-label="Internship filters">
      <div className="filters-title">
        <SlidersHorizontal size={15} aria-hidden="true" />
        <span>Narrow your search</span>
      </div>
      <div className="filter-fields">
        {[
          ['workMode', 'Work mode', 'workModes', 'All work modes'],
          ['roleCategory', 'Role category', 'roleCategories', 'All categories'],
          ['location', 'Location', 'locations', 'All locations'],
        ].map(([key, name, optionKey, placeholder]) => (
          <label htmlFor={`filter-${key}`} key={key}>
            {name}
            <select
              id={`filter-${key}`}
              value={filters[key]}
              disabled={loading || error}
              onChange={(event) => onChange(key, event.target.value)}
            >
              <option value="">{placeholder}</option>
              {options[optionKey].map((value) => (
                <option key={value} value={value}>
                  {key === 'location' ? value : label(value)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="button"
          className="clear-filters-button"
          disabled={!canClear}
          onClick={onClear}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Clear filters
        </button>
      </div>
      {loading && <p className="filters-help">Loading filter options…</p>}
      {error && (
        <p className="filters-help filters-error">
          Filter options couldn't be loaded. Search is still available.{' '}
          <button type="button" onClick={onRetry}>
            Retry filters
          </button>
        </p>
      )}
      {!loading && !error && (
        <p className="filters-help">
          Filters combine with your submitted search. Clear filters resets the
          search too.
        </p>
      )}
    </div>
  )
}
