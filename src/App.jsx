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
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="border-b border-slate-200 bg-white">
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs text-white">
              遊
            </span>
            <span>遊點易思</span>
            <span className="rounded border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700">
              AI
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              首頁
            </NavLink>
            <NavLink
              to="/admin/groups"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              團體管理
            </NavLink>
          </nav>
        </header>
      </div>
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>
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
