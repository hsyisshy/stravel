import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  formatDate,
  formatDateTime,
  getAnnouncementFeed,
  getGroupById,
  getItineraryFeed,
  getPhotoFeed,
} from '../lib/storage'

const tabs = [
  { key: 'announcements', label: '公告' },
  { key: 'itinerary', label: '行程' },
  { key: 'photos', label: '照片' },
  { key: 'info', label: '團體資訊' },
]

function GroupPublicPage() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('announcements')

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
  }, [groupId])

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

  const announcements = getAnnouncementFeed(group)
  const itineraryFeed = getItineraryFeed(group)
  const photoFeed = getPhotoFeed(group)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{group.name}</h1>
        <p className="mt-2 text-sm text-slate-500">
          行程日期: {formatDate(group.departureDate)} - {formatDate(group.returnDate)}
        </p>

        <div className="mt-5">
          <Link
            to={`/group/${group.id}/join`}
            className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            尚未加入？點我填資料
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'announcements' && (
          <div className="mt-4 space-y-3">
            {announcements.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">目前沒有公告。</p>
            )}
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900">{announcement.title}</h3>
                  {announcement.pinned && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      置頂
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{announcement.content}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDateTime(announcement.publishedAt)}</p>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="mt-4 space-y-3">
            {itineraryFeed.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">目前沒有行程資料。</p>
            )}
            {itineraryFeed.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-cyan-700">
                  {formatDate(item.date)} {item.time}
                </p>
                <h3 className="mt-1 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">地點: {item.location}</p>
                {item.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{item.description}</p>
                )}
              </article>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {photoFeed.length === 0 && (
              <p className="col-span-full rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
                目前沒有照片。
              </p>
            )}
            {photoFeed.map((photo) => (
              <article key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">
                <img src={photo.image} alt={photo.title} className="h-40 w-full object-cover" />
                <div className="space-y-1 p-3">
                  <h3 className="text-sm font-bold text-slate-900">{photo.title}</h3>
                  <p className="text-xs text-slate-400">{formatDateTime(photo.uploadedAt)}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'info' && (
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-slate-500">集合地點</dt>
              <dd className="mt-1 font-semibold text-slate-900">{group.meetingPoint}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-slate-500">導遊聯絡方式</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {group.guideName} / {group.guidePhone}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <dt className="text-slate-500">注意事項</dt>
              <dd className="mt-1 whitespace-pre-line text-slate-700">
                {group.notes || '請留意集合時間與證件。'}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  )
}

export default GroupPublicPage
