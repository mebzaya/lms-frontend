import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LockIcon, LogoutIcon, MenuIcon, UserIcon } from '../components/icons'
import './AppShell.css'

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function AppShell({ navItems }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const basePath = user?.role === 'admin' ? '/admin' : '/dashboard'

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`app-shell${collapsed ? ' app-shell-collapsed' : ''}`}>
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <span className="app-logo-mark">L</span>
          <span className="app-logo-text">LMS</span>
        </div>

        <nav className="app-sidebar-nav">
          {navItems.map((item) =>
            item.section ? (
              <div className="app-nav-group" key={item.section}>
                <span className="app-nav-group-label">{item.section}</span>
                {item.items.map((subItem) => (
                  <NavLink
                    key={subItem.to}
                    to={subItem.to}
                    end={subItem.end}
                    className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
                    title={subItem.label}
                  >
                    <span className="app-nav-icon">{subItem.icon}</span>
                    <span className="app-nav-label">{subItem.label}</span>
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
                title={item.label}
              >
                <span className="app-nav-icon">{item.icon}</span>
                <span className="app-nav-label">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="app-body">
        <header className="app-topbar">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            <MenuIcon />
          </button>

          <div className="app-topbar-spacer" />

          <div className="app-user-menu" ref={menuRef}>
            <button
              type="button"
              className="app-user-trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div className="app-user-info">
                <span className="app-user-name">{user?.name}</span>
                <span className="app-user-role">{user?.role}</span>
              </div>
              <span className="app-user-avatar">{initials(user?.name)}</span>
            </button>

            {menuOpen && (
              <div className="app-user-dropdown">
                <div className="app-user-dropdown-header">
                  <span className="app-user-avatar">{initials(user?.name)}</span>
                  <div>
                    <p className="app-dropdown-name">{user?.name}</p>
                    <p className="app-dropdown-email">{user?.email}</p>
                  </div>
                </div>

                <Link to={`${basePath}/profile`} className="app-dropdown-item" onClick={() => setMenuOpen(false)}>
                  <UserIcon />
                  My Profile
                </Link>
                <Link
                  to={`${basePath}/profile/password`}
                  className="app-dropdown-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <LockIcon />
                  Change Password
                </Link>

                <div className="app-dropdown-divider" />

                <button type="button" className="app-dropdown-item app-dropdown-danger" onClick={logout}>
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
