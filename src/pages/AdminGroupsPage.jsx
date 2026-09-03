import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, getMyGroups } from '../lib/storage'

function AdminGroupsPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getMyGroups()
        setGroups(data)
      } catch (err) {
        setError(err.message || '讀取團體失敗')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">團體列表</h1>
          <p className="mt-1 text-sm text-slate-500">
            此瀏覽器建立過的旅遊團體。換裝置或清除瀏覽資料後，請改用建團時取得的管理連結進入。
          </p>
        </div>
        <Link
          to="/admin/groups/new"
          className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
        >
          新增團體
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] table-auto text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">團名</th>
              <th className="px-4 py-3 font-semibold">日期</th>
              <th className="px-4 py-3 font-semibold">導遊</th>
              <th className="px-4 py-3 font-semibold">旅客數</th>
              <th className="px-4 py-3 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                  讀取中...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td className="px-4 py-10 text-center text-rose-500" colSpan={5}>
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && groups.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-slate-400" colSpan={5}>
                  此瀏覽器尚未建立過團體，先新增一個吧。
                </td>
              </tr>
            )}
            {groups.map((group) => (
              <tr key={group.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-900">{group.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(group.departureDate)} - {formatDate(group.returnDate)}
                </td>
                <td className="px-4 py-3 text-slate-600">{group.guideName}</td>
                <td className="px-4 py-3 text-slate-600">{group.travelers?.length || 0}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/admin/groups/${group.id}?token=${group.adminToken}`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
                  >
                    進入管理
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminGroupsPage
