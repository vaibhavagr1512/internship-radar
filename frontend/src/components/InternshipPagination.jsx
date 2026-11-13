import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function InternshipPagination({
  page,
  size,
  sort,
  totalElements,
  totalPages,
  loading,
  error,
  onPageChange,
  onSizeChange,
  onSortChange,
}) {
  const start = totalElements === 0 ? 0 : page * size + 1
  const end = Math.min((page + 1) * size, totalElements)
  return (
    <div className="pagination-panel">
      <div className="list-options">
        <label htmlFor="internship-sort">
          Sort by
          <select
            id="internship-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
          >
            <option value="lastVerifiedDate,desc">
              Last verified: newest first
            </option>
            <option value="lastVerifiedDate,asc">
              Last verified: oldest first
            </option>
            <option value="deadline,asc">Deadline: earliest first</option>
            <option value="deadline,desc">Deadline: latest first</option>
          </select>
        </label>
        <label htmlFor="internship-page-size">
          Per page
          <select
            id="internship-page-size"
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
          >
            {[2, 6, 12, 24].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav className="pagination-navigation" aria-label="Internship pagination">
        <span className="page-range">
          {loading
            ? 'Loading page…'
            : error
              ? 'Page unavailable'
              : `Showing ${start}–${end} of ${totalElements}`}
        </span>
        <div className="page-buttons">
          <button
            className="secondary-button"
            type="button"
            disabled={loading || error || page === 0 || totalPages === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={15} aria-hidden="true" />
            Previous
          </button>
          <span className="page-number" aria-live="polite">
            Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
          </span>
          <button
            className="secondary-button"
            type="button"
            disabled={
              loading || error || totalPages === 0 || page >= totalPages - 1
            }
            onClick={() => onPageChange(page + 1)}
          >
            Next
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  )
}
