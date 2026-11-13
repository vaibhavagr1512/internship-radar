export const internships = [
  {
    id: 1,
    title: '[DEMO] Java Backend Intern',
    company: '[DEMO] Example Systems',
    location: 'Bengaluru',
    workMode: 'HYBRID',
    roleCategory: 'BACKEND',
    eligibilityText:
      'DEMO ONLY: third-year B.Tech students; Java and SQL basics.',
    applicationUrl: 'https://example.com/internships/java',
    deadline: null,
    lastVerifiedDate: '2026-11-12',
  },
  {
    id: 2,
    title: '[DEMO] React Frontend Intern',
    company: '[DEMO] Sample Labs',
    location: 'Remote',
    workMode: 'REMOTE',
    roleCategory: 'FRONTEND',
    eligibilityText: 'DEMO ONLY: third-year B.Tech students; React basics.',
    applicationUrl: 'https://example.com/internships/react',
    deadline: '2026-12-31',
    lastVerifiedDate: '2026-11-12',
  },
  {
    id: 3,
    title: '[DEMO] Software Engineering Intern',
    company: '[DEMO] Java Learning Co',
    location: 'Hyderabad',
    workMode: 'ONSITE',
    roleCategory: 'SOFTWARE',
    eligibilityText:
      'DEMO ONLY: third-year B.Tech students; data structures basics.',
    applicationUrl: 'https://example.com/internships/software',
    deadline: null,
    lastVerifiedDate: '2026-11-12',
  },
]

export const filterOptions = {
  workModes: ['HYBRID', 'ONSITE', 'REMOTE'],
  roleCategories: ['BACKEND', 'FRONTEND', 'SOFTWARE'],
  locations: ['Bengaluru', 'Hyderabad', 'Remote'],
}
