import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  formatDate,
  formatDateTime,
  getAnnouncementFeed,
  getGroupById,
  getItineraryFeed,
  getStoredParticipantId,
} from '../lib/storage'
import SmartLocationView from '../components/SmartLocationView'
import PhotoGalleryView from '../components/PhotoGalleryView'

const navItems = [
  { key: 'location', label: '智慧定位', icon: 'pin' },
  { key: 'rollcall', label: '快速點名', icon: 'check' },
  { key: 'guide', label: '景點導覽', icon: 'bulb' },
  { key: 'photos', label: '精彩照片', icon: 'image' },
]

function NavIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (name === 'pin') {
    return (
      <svg {...common}>
        <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    )
  }
  if (name === 'check') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="m16 12 2 2 3.5-3.5" />
      </svg>
    )
  }
  if (name === 'bulb') {
    return (
      <svg {...common}>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a6 6 0 0 0-4 10.5c.6.6 1 1.5 1 2.5h6c0-1 .4-1.9 1-2.5A6 6 0 0 0 12 2Z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  )
}

function GroupPublicPage() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('location')
  const [showMore, setShowMore] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getGroupById(groupId)
        setGroup(data)
      } catch (err) {
        setError(err.message || '讀取團體失敗')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [groupId, refreshKey])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        讀取中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    )
  }

  if (!group) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        找不到團體。
      </div>
    )
  }

  const participantId = getStoredParticipantId(groupId)
  const announcements = getAnnouncementFeed(group)
  const itineraryFeed = getItineraryFeed(group)

  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{group.name}</h1>
        <p className="mt-2 text-sm text-slate-500">
          行程日期: {formatDate(group.departureDate)} - {formatDate(group.returnDate)}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {!participantId && (
            <Link
              to={`/group/${group.id}/join`}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
            >
              尚未加入？點我填資料
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-slate-400"
          >
            {showMore ? '收合公告與行程' : '查看公告與行程'}
          </button>
        </div>

        {showMore && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">公告</h2>
              <div className="mt-2 space-y-2">
                {announcements.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-400">目前沒有公告。</p>
                )}
                {announcements.map((a) => (
                  <article key={a.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                      {a.pinned && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          置頂
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{a.content}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(a.publishedAt)}</p>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">行程</h2>
              <div className="mt-2 space-y-2">
                {itineraryFeed.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-400">目前沒有行程資料。</p>
                )}
                {itineraryFeed.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-cyan-700">
                      {formatDate(item.date)} {item.time}
                    </p>
                    <h3 className="mt-0.5 text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">地點: {item.location}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-500 to-slate-400 p-4 shadow-sm">
        <div className="rounded-2xl bg-white/95 p-4">
          {activeTab === 'location' && <SmartLocationView group={group} />}

          {activeTab === 'rollcall' && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-10 text-center">
              <p className="text-base font-bold text-slate-700">快速點名即將推出</p>
              <p className="text-sm text-slate-500">敬請期待下一階段更新。</p>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-10 text-center">
              <p className="text-base font-bold text-slate-700">景點導覽即將推出</p>
              <p className="text-sm text-slate-500">敬請期待下一階段更新。</p>
            </div>
          )}

          {activeTab === 'photos' && (
            <PhotoGalleryView
              group={group}
              participantId={participantId}
              onUploaded={() => setRefreshKey((x) => x + 1)}
            />
          )}
        </div>

        <nav className="mt-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition ${
                activeTab === item.key ? 'bg-white text-slate-900 shadow' : 'bg-amber-100/90 text-slate-700 hover:bg-amber-100'
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
      </section>
    </div>
  )
}

export default GroupPublicPage
