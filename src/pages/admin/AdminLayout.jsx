import AppShell from '../../layouts/AppShell'
import {
  CheckIcon,
  ClassesIcon,
  DashboardIcon,
  ExamIcon,
  LessonsIcon,
  SubjectsIcon,
  UsersIcon,
} from '../../components/icons'

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { to: '/admin/attendance', label: 'Attendance', icon: <CheckIcon /> },
  {
    section: 'Course',
    items: [
      { to: '/admin/classes', label: 'Classes', icon: <ClassesIcon /> },
      { to: '/admin/subjects', label: 'Subjects', icon: <SubjectsIcon /> },
      { to: '/admin/lessons', label: 'Lessons', icon: <LessonsIcon /> },
    ],
  },
  {
    section: 'Management',
    items: [
      { to: '/admin/users', label: 'Users', icon: <UsersIcon /> },
      { to: '/admin/exams', label: 'Exams', icon: <ExamIcon /> },
    ],
  },
]

export default function AdminLayout() {
  return <AppShell navItems={NAV_ITEMS} />
}
