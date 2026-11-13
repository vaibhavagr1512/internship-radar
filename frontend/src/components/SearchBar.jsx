import { ArrowRight, Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, onSearch, onClear }) {
  return (
    <form
      className="search-form"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(value)
      }}
    >
      <label className="sr-only" htmlFor="internship-search">
        Search by role or company
      </label>
      <Search size={21} aria-hidden="true" />
      <input
        id="internship-search"
        type="search"
        placeholder="Search by role or company…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      {value && (
        <button
          className="clear-button"
          type="button"
          aria-label="Clear search"
          onClick={onClear}
        >
          <X size={18} />
        </button>
      )}
      <button className="search-button" type="submit">
        Search <ArrowRight size={17} aria-hidden="true" />
      </button>
    </form>
  )
}
