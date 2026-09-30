import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchParentDashboard } from '../api/parent'
import { ClassesIcon, StudentIcon } from '../components/icons'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { ChildResultsPanel } from './ParentChildScores'
import '../styles/common.css'
import '../styles/modeBadge.css'
import './ParentDashboard.css'
import './ParentChildScores.css'

// The "Results" sidebar menu. With one linked child it shows that child's
// results directly; with several, it shows a picker (the same per-child
// detail page — /dashboard/children/:childId — handles the rest).
export default function ParentResults() {
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

  if (children.length > 1) {
    return (
      <div className="parent-dashboard">
        <h1>Results</h1>
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
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="child-scores">
      <Link to="/dashboard" className="back-link">
        &larr; Back to dashboard
      </Link>

      <ChildResultsPanel childId={children[0].id} />
    </div>
  )
}
