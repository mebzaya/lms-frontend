import AppShell from '../layouts/AppShell'
import { useAuth } from '../context/AuthContext'
import { CheckIcon, DashboardIcon, ExamIcon, LessonsIcon, ResultsIcon } from '../components/icons'

const NAV_ITEMS_BY_ROLE = {
  teacher: [
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { to: '/dashboard/attendance', label: 'Attendance', icon: <CheckIcon /> },
    { to: '/dashboard/grading', label: 'Grading queue', icon: <LessonsIcon /> },
    { to: '/dashboard/my-exams', label: 'Exams', icon: <ExamIcon /> },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { to: '/dashboard/my-attendance', label: 'Attendance', icon: <CheckIcon /> },
    { to: '/dashboard/results', label: 'Results', icon: <ResultsIcon /> },
    { to: '/dashboard/exams', label: 'Exams', icon: <ExamIcon /> },
  ],
  parent: [
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, end: true },
    { to: '/dashboard/children/attendance', label: 'Attendance', icon: <CheckIcon /> },
    { to: '/dashboard/children/results', label: 'Results', icon: <ResultsIcon /> },
  ],
}

export default function Dashboard() {
  const { user } = useAuth()
  const navItems = NAV_ITEMS_BY_ROLE[user?.role] ?? [
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, end: true },
  ]

  return <AppShell navItems={navItems} />
}
