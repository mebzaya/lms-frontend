import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchParentDashboard } from '../api/parent'
import { ClassesIcon, StudentIcon } from '../components/icons'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import './ParentDashboard.css'

export default function ParentDashboard() {
  const [children, setChildren] = useState(null)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchParentDashboard()
      .then(setChildren)
      .catch(() => setError('Could not load your children right now.'))
  }, [])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!children) {
    return <p className="student-status">Loading...</p>
  }

  if (children.length === 0) {
    return <p className="student-status">No children are linked to your account yet.</p>
  }

  return (
    <div className="parent-dashboard">
      <div className="child-grid">
        {children.map((child) => (
          <Link className="child-card" to={`/dashboard/children/${child.id}`} key={child.id}>
            <span className="child-icon">
              <StudentIcon />
            </span>
            <div className="child-info">
              <p className="child-name">{child.name}</p>
              <p className="child-class">
                <ClassesIcon />
                {child.class ? child.class.name : 'No class assigned'}
              </p>
              <span
                className={`child-results-badge${child.published_results_count > 0 ? ' child-results-badge-published' : ''}`}
              >
                {child.published_results_count > 0
                  ? `${child.published_results_count} result${child.published_results_count === 1 ? '' : 's'} published`
                  : 'No results published yet'}
              </span>
              <p className="child-practice">
                {child.practice_attempts} practice attempt{child.practice_attempts === 1 ? '' : 's'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
