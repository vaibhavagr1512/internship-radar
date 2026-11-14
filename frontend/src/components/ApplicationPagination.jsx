export default function ApplicationPagination({ page, size, total, disabled, onPage, onSize }) {
  const pages = Math.ceil(total / size)
  return (
    <nav className="tracker-pagination" aria-label="Application pagination">
      <label htmlFor="application-page-size">Applications per page
        <select id="application-page-size" aria-label="Applications per page" value={size} disabled={disabled} onChange={(event) => onSize(Number(event.target.value))}>
          {[2, 6, 12, 24].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <p aria-live="polite">Showing {total === 0 ? 0 : page * size + 1}–{Math.min((page + 1) * size, total)} of {total} matching applications</p>
      <div className="page-buttons">
        <button className="secondary-button" type="button" aria-label="Previous application page" disabled={disabled || page === 0} onClick={() => onPage(page - 1)}>Previous</button>
        <span>Page {pages === 0 ? 0 : page + 1} of {pages}</span>
        <button className="secondary-button" type="button" aria-label="Next application page" disabled={disabled || pages === 0 || page >= pages - 1} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </nav>
  )
}
