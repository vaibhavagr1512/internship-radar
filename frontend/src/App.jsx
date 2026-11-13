import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  BriefcaseBusiness,
  Compass,
  GraduationCap,
  Radar,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import InternshipCard from './components/InternshipCard.jsx'
import SearchBar from './components/SearchBar.jsx'
import ApplicationTracker from './components/ApplicationTracker.jsx'
import useApplications from './hooks/useApplications.js'
import {
  fetchInternships,
  fetchFilterOptions,
} from './services/internshipApi.js'
import InternshipFilters from './components/InternshipFilters.jsx'

export default function App() {
  const [view, setView] = useState('explore')
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [filters, setFilters] = useState({
    workMode: '',
    roleCategory: '',
    location: '',
  })
  const [optionReload, setOptionReload] = useState(0)
  const [optionState, setOptionState] = useState({
    options: { workModes: [], roleCategories: [], locations: [] },
    loading: true,
    error: false,
  })
  const [state, setState] = useState({
    internships: [],
    loading: true,
    error: false,
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState({ internships: [], loading: true, error: false })
    fetchInternships({ search, ...filters, signal: controller.signal })
      .then((internships) => {
        if (active) setState({ internships, loading: false, error: false })
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError')
          setState({ internships: [], loading: false, error: true })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [search, filters.workMode, filters.roleCategory, filters.location, reload])

  const tracker = useApplications()
  const trackedIds = new Set(
    tracker.applications.map((item) => item.internship.id),
  )

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setOptionState((previous) => ({ ...previous, loading: true, error: false }))
    fetchFilterOptions({ signal: controller.signal })
      .then((options) => {
        if (active) setOptionState({ options, loading: false, error: false })
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError')
          setOptionState((previous) => ({
            ...previous,
            loading: false,
            error: true,
          }))
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [optionReload])

  const hasFilters = Object.values(filters).some(Boolean)
  function clearAllFilters() {
    setFilters({ workMode: '', roleCategory: '', location: '' })
    setDraft('')
    setSearch('')
    document.getElementById('internship-search')?.focus()
  }

  function runSearch(value) {
    const term = value.trim()
    setDraft(term)
    setSearch(term)
    // Submitting the same term also refreshes its results.
    if (term === search) setReload((value) => value + 1)
  }
  function clearSearch() {
    runSearch('')
    document.getElementById('internship-search')?.focus()
  }
  const { internships, loading, error } = state

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href={view === 'explore' ? '#explore' : '#applications'}
      >
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="#">
          <span className="brand-mark">
            <Radar size={26} aria-hidden="true" />
          </span>
          <span>
            internship
            <span className="brand-second">
              radar<span className="brand-dot">.</span>
            </span>
          </span>
        </a>
        <p className="sidebar-label">YOUR NEXT CHAPTER</p>
        <nav>
          <a
            className={`nav-item ${view === 'explore' ? 'active' : ''}`}
            href="#explore"
            onClick={() => setView('explore')}
            aria-current={view === 'explore' ? 'page' : undefined}
          >
            <Compass size={19} aria-hidden="true" />
            Explore internships
            <span className="nav-dot" />
          </a>
          <button
            type="button"
            className={`nav-item ${view === 'applications' ? 'active' : ''}`}
            onClick={() => setView('applications')}
            aria-current={view === 'applications' ? 'page' : undefined}
          >
            <Bookmark size={19} aria-hidden="true" />
            My applications
            <span className="tracker-nav-count">
              {tracker.loading || tracker.error
                ? '—'
                : tracker.applications.length}
            </span>
          </button>
          <a className="nav-item" href="#how-it-works">
            <BookOpen size={19} aria-hidden="true" />
            How it works
          </a>
        </nav>
        <div className="sidebar-note">
          <GraduationCap size={24} aria-hidden="true" />
          <h2>
            Big ambitions.
            <br />
            Small first steps.
          </h2>
          <p>
            A little curiosity can take you a long way. Find a role worth
            exploring.
          </p>
          <span>
            Made for student journeys{' '}
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          Your career, in motion.
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Discover <span>/</span>{' '}
            <strong>
              {view === 'explore' ? 'Internships' : 'My applications'}
            </strong>
          </span>
          <span className="student-label">
            <GraduationCap size={16} aria-hidden="true" />
            For third-year B.Tech students
          </span>
        </header>
        <main>
          {view === 'explore' && (
            <section className="hero" aria-labelledby="hero-heading">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span /> A LITTLE DIRECTION. A LOT OF POSSIBILITY.
                </p>
                <h1 id="hero-heading">
                  Your next chapter
                  <br />
                  starts <span>here.</span>
                </h1>
                <p className="hero-description">
                  Discover internships that match your interests.
                  <br className="desktop-break" /> Read the requirements. Take
                  your next step.
                </p>
                <a className="hero-link" href="#explore">
                  Find your opportunity{' '}
                  <ArrowDown size={16} aria-hidden="true" />
                </a>
              </div>
              <div className="radar-art" aria-hidden="true">
                <div className="orbit orbit-outer" />
                <div className="orbit orbit-middle" />
                <div className="orbit orbit-inner" />
                <div className="radar-sweep" />
                <span className="orbit-dot dot-one" />
                <span className="orbit-dot dot-two" />
                <span className="orbit-dot dot-three" />
                <div className="radar-center">
                  <BriefcaseBusiness size={36} strokeWidth={1.5} />
                </div>
                <span className="floating-label">
                  <Sparkles size={14} />
                  Possibility, spotted.
                </span>
              </div>
            </section>
          )}
          <div className="demo-notice" role="note">
            <span className="notice-icon">
              <TriangleAlert size={17} aria-hidden="true" />
            </span>
            <p>
              <strong>About demo listings.</strong> Records marked “Demo
              listing” are for learning and testing. They are not active
              opportunities.
            </p>
            <span className="notice-badge">DEMO DATA</span>
          </div>

          {tracker.actionError && (
            <p className="tracking-action-error" role="alert">
              {tracker.actionError}
            </p>
          )}
          {tracker.notice && (
            <p className="tracking-action-notice" role="status">
              {tracker.notice}
            </p>
          )}
          {view === 'applications' && (
            <ApplicationTracker
              tracker={tracker}
              onExplore={() => setView('explore')}
            />
          )}
          {view === 'explore' && (
            <section
              className="explore-section"
              id="explore"
              aria-labelledby="explore-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow section-eyebrow">
                    A STARTING POINT FOR WHAT'S NEXT
                  </p>
                  <h2 id="explore-heading">
                    Explore internships<span className="heading-dot">.</span>
                  </h2>
                </div>
                <span className="section-note">
                  Stay curious. Start somewhere.
                </span>
              </div>
              {tracker.error && (
                <p className="tracking-load-warning">
                  Your saved status couldn't be loaded.{' '}
                  <button type="button" onClick={tracker.refresh}>
                    Retry tracker
                  </button>
                </p>
              )}
              <SearchBar
                value={draft}
                onChange={setDraft}
                onSearch={runSearch}
                onClear={clearSearch}
              />
              <div className="search-suggestions">
                <span>Try a search</span>
                {['Java', 'React', 'Software'].map((term) => (
                  <button
                    type="button"
                    key={term}
                    onClick={() => runSearch(term)}
                  >
                    {term}
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <InternshipFilters
                filters={filters}
                options={optionState.options}
                loading={optionState.loading}
                error={optionState.error}
                canClear={hasFilters || Boolean(search) || Boolean(draft)}
                onChange={(key, value) =>
                  setFilters((previous) => ({ ...previous, [key]: value }))
                }
                onClear={clearAllFilters}
                onRetry={() => setOptionReload((value) => value + 1)}
              />
              <div className="results-heading">
                <p role="status" aria-live="polite">
                  {loading ? (
                    'Finding opportunities…'
                  ) : error ? (
                    'Internships unavailable'
                  ) : (
                    <>
                      <strong>{internships.length}</strong>{' '}
                      {internships.length === 1 ? 'internship' : 'internships'}
                      {search ? (
                        <>
                          {' '}
                          matching <strong>“{search}”</strong>
                        </>
                      ) : hasFilters ? (
                        ' matching your filters'
                      ) : (
                        ' to explore'
                      )}
                    </>
                  )}
                </p>
                <span>Find your fit, one role at a time</span>
              </div>

              <div aria-busy={loading}>
                {loading ? (
                  <div className="internship-grid" aria-hidden="true">
                    {[1, 2, 3].map((id) => (
                      <div className="skeleton-card" key={id}>
                        <div />
                        <div />
                        <div />
                        <div />
                        <div />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="empty-state" role="alert">
                    <span className="empty-icon">
                      <TriangleAlert size={26} />
                    </span>
                    <h3>We couldn't load internships</h3>
                    <p>
                      The internship list is unavailable right now. Please try
                      again.
                    </p>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => setReload((value) => value + 1)}
                    >
                      <RefreshCw size={16} aria-hidden="true" />
                      Try again
                    </button>
                  </div>
                ) : internships.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">
                      <Search size={26} />
                    </span>
                    <h3>No internships found</h3>
                    <p>
                      Try another role, company, or filter combination. Clear
                      your search and filters to see all listings.
                    </p>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={clearAllFilters}
                    >
                      {hasFilters
                        ? 'Clear search and filters'
                        : 'View all internships'}
                    </button>
                  </div>
                ) : (
                  <div className="internship-grid">
                    {internships.map((internship) => (
                      <InternshipCard
                        key={internship.id}
                        internship={internship}
                        isTracked={trackedIds.has(internship.id)}
                        saving={tracker.pending.has(`save:${internship.id}`)}
                        saveDisabled={
                          tracker.loading ||
                          tracker.error ||
                          tracker.pending.size > 0
                        }
                        onSave={() => tracker.save(internship.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
          <section
            className="how-it-works"
            id="how-it-works"
            aria-labelledby="how-heading"
          >
            <div>
              <p className="eyebrow">FROM CURIOUS TO CONFIDENT</p>
              <h2 id="how-heading">A good next step is an informed one.</h2>
            </div>
            <div className="how-steps">
              <p>
                <span>01</span>
                <strong>Explore a role</strong>Search by title or company.
              </p>
              <p>
                <span>02</span>
                <strong>Check the fit</strong>Read eligibility and deadlines.
              </p>
              <p>
                <span>03</span>
                <strong>Go to the source</strong>Use the official application
                link.
              </p>
            </div>
            <p className="how-footnote">
              Eligibility is provided as text. Always confirm requirements on
              the official listing. Demo links lead to example.com.
            </p>
          </section>
          <footer className="page-footer">
            <span>
              Internship Radar <span className="footer-dot">·</span> A little
              direction for your next big thing.
            </span>
            <span>Built with curiosity.</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
