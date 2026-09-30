import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchChildAttendance } from '../api/attendance'
import { fetchParentDashboard } from '../api/parent'
import { ClassesIcon, StudentIcon } from '../components/icons'
import { useEffectDeduped } from '../hooks/useEffectDeduped'
import { AttendanceHistoryPanel } from './StudentAttendance'
import './ParentDashboard.css'
import './StudentAttendance.css'

// Reached two ways: `/dashboard/children/attendance` (the sidebar menu — no
// child chosen yet) and `/dashboard/children/:childId/attendance` (a specific
// child, either linked to directly or picked from this same page's list).
export default function ParentAttendance() {
  const { childId } = useParams()
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

  const selected = childId ? children.find((child) => String(child.id) === childId) : null
  const effectiveChild = selected ?? (children.length === 1 ? children[0] : null)

  if (!effectiveChild) {
    return (
      <div className="parent-dashboard">
        <h1>Attendance</h1>
        <div className="child-grid">
          {children.map((child) => (
            <Link className="child-card" to={`/dashboard/children/${child.id}/attendance`} key={child.id}>
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
    <ChildAttendance
      childId={effectiveChild.id}
      childName={effectiveChild.name}
      backTo={children.length > 1 ? '/dashboard/children/attendance' : '/dashboard'}
      backLabel={children.length > 1 ? 'Back to children' : 'Back to dashboard'}
    />
  )
}

function ChildAttendance({ childId, childName, backTo, backLabel }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffectDeduped(() => {
    fetchChildAttendance(childId)
      .then(setData)
      .catch(() => setError('Could not load attendance right now.'))
  }, [childId])

  if (error) {
    return <p className="student-status auth-error">{error}</p>
  }

  if (!data) {
    return <p className="student-status">Loading...</p>
  }

  return (
    <div className="student-dashboard">
      <Link to={backTo} className="back-link">
        &larr; {backLabel}
      </Link>

      <h1>{childName}'s attendance</h1>

      <AttendanceHistoryPanel data={data} />
    </div>
  )
}
