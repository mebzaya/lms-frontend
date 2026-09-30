import { useAuth } from '../context/AuthContext'
import StudentDashboard from './StudentDashboard'
import TeacherDashboard from './TeacherDashboard'
import ParentDashboard from './ParentDashboard'

export default function DashboardHome() {
  const { user } = useAuth()

  return (
    <>
      <h1>Welcome back{user?.name ? `, ${user.name}` : ''}.</h1>

      {user?.role === 'student' ? (
        <StudentDashboard />
      ) : user?.role === 'teacher' ? (
        <TeacherDashboard />
      ) : user?.role === 'parent' ? (
        <ParentDashboard />
      ) : (
        <p>
          You're signed in as {user?.email}
          {user?.role ? ` (${user.role})` : ''}.
        </p>
      )}
    </>
  )
}
