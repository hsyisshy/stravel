import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { APIProvider } from '@vis.gl/react-google-maps'
import HomePage from './pages/HomePage'
import AdminGroupsPage from './pages/AdminGroupsPage'
import NewGroupPage from './pages/NewGroupPage'
import AdminGroupDetailPage from './pages/AdminGroupDetailPage'
import GroupJoinPage from './pages/GroupJoinPage'
import GroupPublicPage from './pages/GroupPublicPage'

function Shell({ bare, children }) {
  if (bare) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="relative overflow-hidden border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,116,144,0.12),transparent_40%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.12),transparent_35%)]" />
        <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-extrabold tracking-tight text-slate-900">
            Stravel Ops
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              首頁
            </NavLink>
            <NavLink
              to="/admin/groups"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              團體管理
            </NavLink>
          </nav>
        </header>
      </div>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}

function App() {
  const location = useLocation()
  const isTravelerRoute = location.pathname.startsWith('/group/')

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <Shell bare={isTravelerRoute}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/groups" element={<AdminGroupsPage />} />
          <Route path="/admin/groups/new" element={<NewGroupPage />} />
          <Route path="/admin/groups/:groupId" element={<AdminGroupDetailPage />} />
          <Route path="/group/:groupId/join" element={<GroupJoinPage />} />
          <Route path="/group/:groupId" element={<GroupPublicPage />} />
          <Route
            path="*"
            element={
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">找不到頁面</h1>
              </div>
            }
          />
        </Routes>
      </Shell>
    </APIProvider>
  )
}

export default App
