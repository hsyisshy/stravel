import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
import AiTourGuideView from '../components/AiTourGuideView'
import RollCallTravelerView from '../components/RollCallTravelerView'
import AiAssistantDrawer from '../components/AiAssistantDrawer'

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

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

function HeaderLeft({ tab, groupName }) {
  if (tab === 'photos') {
    return <span className="text-sm font-semibold text-slate-900">{groupName}</span>
  }

  if (tab === 'guide') {
    return <span className="text-xs font-semibold text-slate-500">Gemini 多模態語音導覽</span>
  }

  if (tab === 'rollcall') {
    return <span className="text-xs font-semibold text-slate-500">快速 GPS 簽到</span>
  }

  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
      </span>
      系統正持續追蹤定位中
    </span>
  )
}

function GroupPublicPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('location')
  const [showInfoPanel, setShowInfoPanel] = useState(false)
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

  useEffect(() => {
    if (!loading && group && !getStoredParticipantId(groupId)) {
      navigate(`/group/${groupId}/join`, { replace: true })
    }
  }, [loading, group, groupId, navigate])

  if (loading || (group && !getStoredParticipantId(groupId))) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
        讀取中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error}
      </div>
    )
  }

  if (!group) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        找不到團體。
      </div>
    )
  }

  const participantId = getStoredParticipantId(groupId)
  const announcements = getAnnouncementFeed(group)
  const itineraryFeed = getItineraryFeed(group)
  const hasUpdates = announcements.length > 0 || itineraryFeed.length > 0

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-16">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex items-center justify-between border-b border-slate-100 pb-4">
          <HeaderLeft tab={activeTab} groupName={group.name} />

          <button
            type="button"
            onClick={() => setShowInfoPanel((v) => !v)}
            className="relative rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            aria-label="公告與行程"
          >
            <BellIcon />
            {hasUpdates && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
            )}
          </button>

          {showInfoPanel && (
            <div className="absolute right-0 top-full z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">公告與行程</h2>
                <button
                  type="button"
                  onClick={() => setShowInfoPanel(false)}
                  className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  關閉
                </button>
              </div>

              <div className="mt-3 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">公告</h3>
                  <div className="mt-2 space-y-2">
                    {announcements.length === 0 && (
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-400">目前沒有公告。</p>
                    )}
                    {announcements.map((a) => (
                      <article key={a.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                          {a.pinned && (
                            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
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
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">行程</h3>
                  <div className="mt-2 space-y-2">
                    {itineraryFeed.length === 0 && (
                      <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-400">目前沒有行程資料。</p>
                    )}
                    {itineraryFeed.map((item) => (
                      <article key={item.id} className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-cyan-700">
                          {formatDate(item.date)} {item.time}
                        </p>
                        <h4 className="mt-0.5 text-sm font-bold text-slate-900">{item.title}</h4>
                        <p className="mt-0.5 text-sm text-slate-600">地點: {item.location}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">團體資訊</h3>
                  <div className="mt-2 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-slate-500">集合地點</p>
                      <p className="mt-0.5 font-semibold text-slate-900">{group.meetingPoint}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">導遊聯絡方式</p>
                      <p className="mt-0.5 font-semibold text-slate-900">
                        {group.guideName} / {group.guidePhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="pt-4">
          {activeTab === 'location' && <SmartLocationView group={group} />}

          {activeTab === 'rollcall' && (
            <RollCallTravelerView
              group={group}
              participantId={participantId}
              onRefresh={() => setRefreshKey((x) => x + 1)}
            />
          )}

          {activeTab === 'guide' && <AiTourGuideView group={group} />}

          {activeTab === 'photos' && (
            <PhotoGalleryView
              group={group}
              participantId={participantId}
              onUploaded={() => setRefreshKey((x) => x + 1)}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <nav className="mt-4 grid grid-cols-4 gap-1.5 border-t border-slate-100 pt-4">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActiveTab(item.key)
                setShowInfoPanel(false)
              }}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-semibold transition ${
                activeTab === item.key
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </button>
          ))}
        </nav>
      </section>

      {/* Floating 24/7 AI Tour Assistant Widget */}
      <AiAssistantDrawer group={group} />
    </div>
  )
}

export default GroupPublicPage
