import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ApplicationDetailsEditor from './ApplicationDetailsEditor.jsx'
import { internships } from '../test/fixtures.js'
const application = {
  id: 1,
  internship: internships[0],
  status: 'APPLIED',
  notes: 'Existing note',
  appliedDate: '2026-11-12',
}

describe('application detail editor', () => {
  it('shows saved details and keeps Save disabled until a change', () => {
    render(
      <ApplicationDetailsEditor
        application={application}
        disabled={false}
        onSave={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('textbox', { name: 'Notes for Java Backend Intern' }),
    ).toHaveValue('Existing note')
    expect(
      screen.getByLabelText('Applied date for Java Backend Intern'),
    ).toHaveValue('2026-11-12')
    expect(
      screen.getByRole('button', {
        name: 'Save details for Java Backend Intern',
      }),
    ).toBeDisabled()
  })
  it('submits only notes and the calendar date', async () => {
    const save = vi.fn()
    const user = userEvent.setup()
    render(
      <ApplicationDetailsEditor
        application={application}
        disabled={false}
        onSave={save}
      />,
    )
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Follow up next week')
    fireEvent.change(
      screen.getByLabelText('Applied date for Java Backend Intern'),
      { target: { value: '2026-11-13' } },
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Save details for Java Backend Intern',
      }),
    )
    expect(save).toHaveBeenCalledWith(1, {
      notes: 'Follow up next week',
      appliedDate: '2026-11-13',
    })
  })
  it('sends null when the applied date is cleared', async () => {
    const save = vi.fn()
    const user = userEvent.setup()
    render(
      <ApplicationDetailsEditor
        application={application}
        disabled={false}
        onSave={save}
      />,
    )
    fireEvent.change(
      screen.getByLabelText('Applied date for Java Backend Intern'),
      { target: { value: '' } },
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Save details for Java Backend Intern',
      }),
    )
    expect(save).toHaveBeenCalledWith(1, {
      notes: 'Existing note',
      appliedDate: null,
    })
  })
  it('cancel restores the last saved values', async () => {
    const user = userEvent.setup()
    render(
      <ApplicationDetailsEditor
        application={application}
        disabled={false}
        onSave={vi.fn()}
      />,
    )
    await user.type(screen.getByRole('textbox'), ' changed')
    await user.click(
      screen.getByRole('button', {
        name: 'Cancel details changes for Java Backend Intern',
      }),
    )
    expect(screen.getByRole('textbox')).toHaveValue('Existing note')
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })
  it('does not overwrite a draft on a status-only update', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <ApplicationDetailsEditor
        application={application}
        disabled={false}
        onSave={vi.fn()}
      />,
    )
    await user.type(screen.getByRole('textbox'), ' draft')
    rerender(
      <ApplicationDetailsEditor
        application={{ ...application, status: 'INTERVIEW' }}
        disabled={false}
        onSave={vi.fn()}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveValue('Existing note draft')
  })
  it('accepts server-confirmed details and marks them as saved', async () => {
    const { rerender } = render(
      <ApplicationDetailsEditor
        application={application}
        disabled={false}
        onSave={vi.fn()}
      />,
    )
    rerender(
      <ApplicationDetailsEditor
        application={{
          ...application,
          notes: 'Confirmed',
          appliedDate: '2026-11-13',
        }}
        disabled={false}
        onSave={vi.fn()}
      />,
    )
    await waitFor(() =>
      expect(screen.getByRole('textbox')).toHaveValue('Confirmed'),
    )
    expect(
      screen.getByRole('button', {
        name: 'Save details for Java Backend Intern',
      }),
    ).toBeDisabled()
  })
  it('enforces the notes limit and disables fields during a write', () => {
    render(
      <ApplicationDetailsEditor
        application={application}
        disabled={true}
        onSave={vi.fn()}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '2000')
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(
      screen.getByLabelText('Applied date for Java Backend Intern'),
    ).toBeDisabled()
  })
  it('renders HTML-looking notes as plain textarea text', () => {
    const notes = '<script>alert("test")</script>'
    const { container } = render(
      <ApplicationDetailsEditor
        application={{ ...application, notes }}
        disabled={false}
        onSave={vi.fn()}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveValue(notes)
    expect(container.querySelector('script')).toBeNull()
  })
})
