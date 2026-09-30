import { useState } from 'react'
import { fetchStats } from '../../api/admin'
import { AdminIcon, ParentIcon, StudentIcon, TeacherIcon } from '../../components/icons'
import { useEffectDeduped } from '../../hooks/useEffectDeduped'
import './admin.css'

const STAT_CARDS = [
  { key: 'teachers', label: 'Teachers', icon: <TeacherIcon /> },
  { key: 'students', label: 'Students', icon: <StudentIcon /> },
  { key: 'parents', label: 'Parents', icon: <ParentIcon /> },
  { key: 'admins', label: 'Admins', icon: <AdminIcon /> },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffectDeduped(() => {
    fetchStats()
      .then(setStats)
      .catch(() => {
        // stat cards just stay empty if this fails
      })
  }, [])

  return (
    <div className="admin-page">
      <h1>Admin dashboard</h1>

      <section className="stat-grid">
        {STAT_CARDS.map((card) => (
          <div className="stat-card" key={card.key}>
            <div className="stat-icon">{card.icon}</div>
            <div>
              <p className="stat-value">{stats ? stats[card.key] : '—'}</p>
              <p className="stat-label">{card.label}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
