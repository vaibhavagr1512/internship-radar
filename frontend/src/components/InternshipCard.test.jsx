import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import InternshipCard, {
  formatDate,
  safeApplicationUrl,
} from './InternshipCard.jsx'
import { internships } from '../test/fixtures.js'

describe('internship cards', () => {
  it('shows all required information and labels fictional records', () => {
    render(<InternshipCard internship={internships[0]} />)
    expect(
      screen.getByRole('heading', { name: 'Java Backend Intern' }),
    ).toBeVisible()
    for (const value of [
      'Example Systems',
      'Bengaluru',
      'Hybrid',
      'Backend',
      internships[0].eligibilityText,
      'Demo listing',
      '12 Nov 2026',
      'Not specified',
    ]) {
      expect(screen.getByText(value)).toBeVisible()
    }
    expect(screen.queryByText('Last verified')).not.toBeInTheDocument()
    const link = screen.getByRole('link', {
      name: /View demo link.*Java Backend Intern/,
    })
    expect(link).toHaveAttribute('href', internships[0].applicationUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
  it('shows a provided deadline with a stable calendar date', () => {
    render(<InternshipCard internship={internships[1]} />)
    expect(screen.getByText('31 Dec 2026')).toBeVisible()
  })
  it('uses an application action for a non-demo listing', () => {
    render(
      <InternshipCard
        internship={{
          ...internships[0],
          title: 'Java Intern',
          company: 'Company',
        }}
      />,
    )
    expect(
      screen.getByRole('link', { name: /Apply for Java Intern at Company/ }),
    ).toBeVisible()
    expect(screen.getByText(/Last verified/)).toBeVisible()
    expect(screen.queryByText('Demo listing')).not.toBeInTheDocument()
  })
  it('does not render executable or credential-bearing application URLs', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,test',
      'not-a-url',
      'https://user:password@example.com',
    ]) {
      expect(safeApplicationUrl(value)).toBeNull()
    }
    render(
      <InternshipCard
        internship={{
          ...internships[0],
          applicationUrl: 'javascript:alert(1)',
        }}
      />,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Link unavailable')).toBeVisible()
  })
  it('handles missing or invalid dates', () => {
    expect(formatDate(null)).toBe('Not specified')
    expect(formatDate('invalid')).toBe('Not specified')
  })
})
