import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  addAnnouncement,
  addAttendanceEvent,
  addItineraryItem,
  addPhoto,
  addRecommendation,
  deleteItineraryItem,
  formatDate,
  formatDateTime,
  getAnnouncementFeed,
  getGroupById,
  getItineraryFeed,
  getPhotoFeed,
  removeTraveler,
  setAttendanceStatus,
  updateGroupLocation,
} from '../lib/storage'
import LocationPicker from '../components/LocationPicker'
import AdminLiveMapView from '../components/AdminLiveMapView'
import { AiItineraryModal, AiAnnouncementModal, AiTripInsightsModal } from '../components/AdminAiModals'

const tabs = [
  { key: 'travelers', label: '團員名單' },
  { key: 'announcements', label: '公告區' },
  { key: 'itinerary', label: '行程一覽表' },
  { key: 'insights', label: 'AI 行前評估' },
  { key: 'photos', label: '照片區' },
  { key: 'attendance', label: '點名功能' },
  { key: 'live-map', label: '即時位置' },
  { key: 'post-trip', label: '旅程後' },
]

function AdminGroupDetailPage() {
  const { groupId } = useParams()
  const [searchParams] = useSearchParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('travelers')
  const [refreshKey, setRefreshKey] = useState(0)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    pinned: false,
  })
  const [itineraryForm, setItineraryForm] = useState({
    date: '',
    time: '',
    title: '',
    location: '',
    description: '',
  })
  const [photoForm, setPhotoForm] = useState({ title: '', file: null })
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [attendanceForm, setAttendanceForm] = useState({ title: '' })
  const [savingError, setSavingError] = useState('')
  const [locationForm, setLocationForm] = useState({ lat: null, lng: null, radiusM: 300 })
  const [savingLocation, setSavingLocation] = useState(false)
  const [removingTravelerId, setRemovingTravelerId] = useState(null)
  const [deletingItemId, setDeletingItemId] = useState(null)

  // AI Modal States
  const [showAiItineraryModal, setShowAiItineraryModal] = useState(false)
  const [showAiAnnouncementModal, setShowAiAnnouncementModal] = useState(false)
  const [showAiInsightsModal, setShowAiInsightsModal] = useState(false)
  const [recommendationForm, setRecommendationForm] = useState({ title: '', content: '', linkUrl: '' })
  const [savingRecommendation, setSavingRecommendation] = useState(false)

  useEffect(() => {
    async function loadGroup() {
      setLoading(true)
      setError('')
      try {
        const data = await getGroupById(groupId)
        setGroup(data)
        setLocationForm({
          lat: data?.meetingLat ?? null,
          lng: data?.meetingLng ?? null,
          radiusM: data?.safetyRadiusM || 300,
        })
      } catch (err) {
        setError(err.message || '讀取團體失敗')
      } finally {
        setLoading(false)
      }
    }

    loadGroup()
  }, [groupId, refreshKey])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">讀取中...</div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
    )
  }

  if (!group) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        找不到團體。
      </div>
    )
  }

  const joinPath = `/group/${groupId}/join`
  const joinLink = `${window.location.origin}${joinPath}`
  const adminTokenFromUrl = searchParams.get('token') || ''
  const canEdit = Boolean(adminTokenFromUrl) && adminTokenFromUrl === group.adminToken
  const announcementFeed = getAnnouncementFeed(group)
  const itineraryFeed = getItineraryFeed(group)
  const photoFeed = getPhotoFeed(group)
  const attendanceEvents = group.attendanceEvents || []
  const travelers = group.travelers || []

  function handleCopy() {
    navigator.clipboard.writeText(joinLink)
  }

  async function handleAnnouncementSubmit(e) {
    e.preventDefault()
    if (!canEdit) return
    setSavingError('')
    try {
      await addAnnouncement(groupId, announcementForm)
      setAnnouncementForm({ title: '', content: '', pinned: false })
      setRefreshKey((x) => x + 1)
    } catch (err) {
      setSavingError(err.message || '儲存公告失敗')
    }
  }

  function handleItinerarySubmit(e) {
    e.preventDefault()
    if (!canEdit) return
    setSavingError('')
    addItineraryItem(groupId, itineraryForm)
      .then(() => {
        setItineraryForm({
          date: '',
          time: '',
          title: '',
          location: '',
          description: '',
        })
        setRefreshKey((x) => x + 1)
      })
      .catch((err) => {
        setSavingError(err.message || '儲存行程失敗')
      })
  }

  async function handleDeleteItinerary(itemId) {
    if (!canEdit) return
    if (!window.confirm('確定要刪除此行程項目嗎？')) return

    setDeletingItemId(itemId)
    try {
      await deleteItineraryItem(groupId, itemId)
      setRefreshKey((x) => x + 1)
    } catch (err) {
      setSavingError(err.message || '刪除行程項目失敗')
    } finally {
      setDeletingItemId(null)
    }
  }

  async function handlePhotoSubmit(e) {
    e.preventDefault()
    if (!canEdit || !photoForm.file) return

    setIsUploadingPhoto(true)
    setSavingError('')
    try {
      await addPhoto(groupId, { title: photoForm.title, file: photoForm.file })
      setPhotoForm({ title: '', file: null })
      setRefreshKey((x) => x + 1)
    } catch (err) {
      setSavingError(err.message || '上傳照片失敗')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  function handleAttendanceCreate(e) {
    e.preventDefault()
    if (!canEdit) return
    setSavingError('')
    addAttendanceEvent(groupId, attendanceForm)
      .then(() => {
        setAttendanceForm({ title: '' })
        setRefreshKey((x) => x + 1)
      })
      .catch((err) => {
        setSavingError(err.message || '建立點名事件失敗')
      })
  }

  async function handleLocationSave() {
    if (!canEdit) return
    setSavingError('')
    setSavingLocation(true)
    try {
      await updateGroupLocation(groupId, {
        meetingLat: locationForm.lat,
        meetingLng: locationForm.lng,
        safetyRadiusM: locationForm.radiusM,
      })
      setRefreshKey((x) => x + 1)
    } catch (err) {
      setSavingError(err.message || '更新集合地點座標失敗')
    } finally {
      setSavingLocation(false)
    }
  }

  function handleAttendanceToggle(eventId, travelerId, arrived) {
    if (!canEdit) return
    setSavingError('')
    setAttendanceStatus(groupId, eventId, travelerId, arrived)
      .then(() => {
        setRefreshKey((x) => x + 1)
      })
      .catch((err) => {
        setSavingError(err.message || '更新點名狀態失敗')
      })
  }

  async function handleRecommendationSubmit(e) {
    e.preventDefault()
    if (!canEdit) return
    setSavingError('')
    setSavingRecommendation(true)
    try {
      await addRecommendation(groupId, recommendationForm)
      setRecommendationForm({ title: '', content: '', linkUrl: '' })
      setRefreshKey((x) => x + 1)
    } catch (err) {
      setSavingError(err.message || '推播新行程失敗')
    } finally {
      setSavingRecommendation(false)
    }
  }

  async function handleRemoveTraveler(traveler) {
    if (!canEdit) return
    if (!window.confirm(`確定要將「${traveler.name}」移出此行程嗎？此動作無法復原。`)) return

    setSavingError('')
    setRemovingTravelerId(traveler.id)
    try {
      await removeTraveler(groupId, traveler.id)
      setRefreshKey((x) => x + 1)
    } catch (err) {
      setSavingError(err.message || '移除團員失敗')
    } finally {
      setRemovingTravelerId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{group.name}</h1>
            <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold text-cyan-800">
              團務中控台
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(group.departureDate)} - {formatDate(group.returnDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/group/${group.id}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
          >
            預覽旅客頁
          </Link>
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
          目前為唯讀模式。請使用正確 token 開啟此頁，格式: /admin/groups/:groupId?token=xxxxx
        </div>
      )}

      {savingError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {savingError}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">團體資訊</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">集合地點</dt>
              <dd className="font-semibold text-slate-900">{group.meetingPoint}</dd>
            </div>
            <div>
              <dt className="text-slate-500">導遊</dt>
              <dd className="font-semibold text-slate-900">
                {group.guideName} ({group.guidePhone})
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">出發日期</dt>
              <dd className="font-semibold text-slate-900">{formatDate(group.departureDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">回程日期</dt>
              <dd className="font-semibold text-slate-900">{formatDate(group.returnDate)}</dd>
            </div>
            {group.notes && (
              <div className="sm:col-span-2">
                <dt className="text-slate-500">備註</dt>
                <dd className="whitespace-pre-line font-medium text-slate-800">{group.notes}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-900">集合地點座標設定（智慧定位中心點）</h3>
            <p className="mt-1 text-xs text-slate-500">
              設定精確座標與安全範圍半徑，旅客端「智慧定位」將自動判斷團員是否脫離安全區域。
            </p>
            <div className="mt-3">
              <LocationPicker
                lat={locationForm.lat}
                lng={locationForm.lng}
                radiusM={locationForm.radiusM}
                onChange={({ lat, lng }) =>
                  setLocationForm((prev) => ({ ...prev, lat, lng }))
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                安全半徑（公尺）：
                <input
                  type="number"
                  min="20"
                  step="10"
                  disabled={!canEdit}
                  className="w-24 rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-900"
                  value={locationForm.radiusM}
                  onChange={(e) =>
                    setLocationForm((prev) => ({
                      ...prev,
                      radiusM: Number(e.target.value) || 300,
                    }))
                  }
                />
              </label>
              {canEdit && (
                <button
                  type="button"
                  disabled={savingLocation}
                  onClick={handleLocationSave}
                  className="rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {savingLocation ? '儲存中...' : '儲存座標設定'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">旅客加入 QR Code</h2>
          <p className="mt-1 text-center text-xs text-slate-500">團員使用手機掃描即可加入此團</p>
          <div className="mt-4 rounded-xl border border-slate-200 p-3 shadow-inner">
            <QRCodeSVG value={joinLink} size={168} />
          </div>
          <div className="mt-4 w-full space-y-2">
            <input
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              value={joinLink}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              複製加入連結
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. 團員名單 */}
        {activeTab === 'travelers' && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">團員名單</h2>
              <p className="text-sm text-slate-500">共 {travelers.length} 人</p>
            </div>

            {travelers.length === 0 && (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
                尚無旅客加入，分享上方的加入連結或 QR Code 給團員。
              </p>
            )}

            {travelers.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">姓名</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">手機</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">備註</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">加入時間</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {travelers.map((traveler) => (
                      <tr key={traveler.id}>
                        <td className="px-4 py-3 font-semibold text-slate-900">{traveler.name}</td>
                        <td className="px-4 py-3 text-slate-700">{traveler.phone}</td>
                        <td className="px-4 py-3 text-slate-500">{traveler.notes || '-'}</td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(traveler.joinedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={!canEdit || removingTravelerId === traveler.id}
                            onClick={() => handleRemoveTraveler(traveler)}
                            className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingTravelerId === traveler.id ? '移除中...' : '移出行程'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. 公告區 */}
        {activeTab === 'announcements' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handleAnnouncementSubmit}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">發布公告</h2>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowAiAnnouncementModal(true)}
                    className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 transition"
                  >
                    AI 草擬
                  </button>
                )}
              </div>

              <label className="form-label mt-4">
                標題
                <input
                  required
                  disabled={!canEdit}
                  className="form-input"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </label>

              <label className="form-label mt-3">
                內容
                <textarea
                  required
                  rows={6}
                  disabled={!canEdit}
                  className="form-input"
                  value={announcementForm.content}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                />
              </label>

              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={announcementForm.pinned}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({ ...prev, pinned: e.target.checked }))
                  }
                />
                置頂公告
              </label>

              <button
                type="submit"
                disabled={!canEdit}
                className="mt-4 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                發布公告
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900">公告列表</h2>
              <div className="mt-4 space-y-3">
                {announcementFeed.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">尚無公告。</p>
                )}
                {announcementFeed.map((announcement) => (
                  <article key={announcement.id} className="rounded-xl border border-slate-200 p-4">
                    <header className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{announcement.title}</h3>
                      {announcement.pinned && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          置頂
                        </span>
                      )}
                    </header>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                      {announcement.content}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      發布於 {formatDateTime(announcement.publishedAt)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. 行程一覽表 */}
        {activeTab === 'itinerary' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handleItinerarySubmit}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">新增行程項目</h2>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowAiItineraryModal(true)}
                    className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 transition"
                  >
                    AI 排程 / 應變
                  </button>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="form-label">
                  日期
                  <input
                    required
                    type="date"
                    disabled={!canEdit}
                    className="form-input"
                    value={itineraryForm.date}
                    onChange={(e) => setItineraryForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </label>

                <label className="form-label">
                  時間
                  <input
                    required
                    type="time"
                    disabled={!canEdit}
                    className="form-input"
                    value={itineraryForm.time}
                    onChange={(e) => setItineraryForm((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </label>
              </div>

              <label className="form-label mt-3">
                標題
                <input
                  required
                  disabled={!canEdit}
                  className="form-input"
                  value={itineraryForm.title}
                  onChange={(e) => setItineraryForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <label className="form-label mt-3">
                地點
                <input
                  required
                  disabled={!canEdit}
                  className="form-input"
                  value={itineraryForm.location}
                  onChange={(e) =>
                    setItineraryForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </label>

              <label className="form-label mt-3">
                說明
                <textarea
                  rows={4}
                  disabled={!canEdit}
                  className="form-input"
                  value={itineraryForm.description}
                  onChange={(e) =>
                    setItineraryForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </label>

              <button
                type="submit"
                disabled={!canEdit}
                className="mt-4 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                新增行程
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">行程時間軸</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAiItineraryModal(true)}
                    className="text-xs font-bold text-cyan-700 hover:underline"
                  >
                    AI 一鍵自動排程 / 應變調程
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {itineraryFeed.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">尚無行程項目。</p>
                )}
                {itineraryFeed.map((item) => (
                  <article key={item.id} className="relative rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-cyan-700">
                          {formatDate(item.date)} {item.time}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">地點: {item.location}</p>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          disabled={deletingItemId === item.id}
                          onClick={() => handleDeleteItinerary(item.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition text-xs"
                          title="刪除行程"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                        {item.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. 照片區 */}
        {activeTab === 'photos' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handlePhotoSubmit}>
              <h2 className="text-xl font-bold text-slate-900">上傳照片</h2>

              <label className="form-label mt-4">
                標題
                <input
                  required
                  disabled={!canEdit}
                  className="form-input"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <label className="form-label mt-3">
                圖片檔
                <input
                  required
                  type="file"
                  accept="image/*"
                  disabled={!canEdit}
                  className="form-input"
                  onChange={(e) =>
                    setPhotoForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))
                  }
                />
              </label>

              <button
                disabled={isUploadingPhoto || !canEdit}
                type="submit"
                className="mt-4 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploadingPhoto ? '上傳中...' : '上傳照片'}
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900">照片牆</h2>
              {photoFeed.length === 0 && (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-400">尚無照片。</p>
              )}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {photoFeed.map((photo) => (
                  <article key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">
                    <img src={photo.image} alt={photo.title} className="h-44 w-full object-cover" />
                    <div className="space-y-1 p-3">
                      <h3 className="text-sm font-bold text-slate-900">{photo.title}</h3>
                      <p className="text-xs text-slate-400">{formatDateTime(photo.uploadedAt)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. 點名功能 */}
        {activeTab === 'attendance' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handleAttendanceCreate}>
              <h2 className="text-xl font-bold text-slate-900">建立點名事件</h2>

              <label className="form-label mt-4">
                事件名稱
                <input
                  required
                  placeholder="例如：機場集合、上遊覽車、景點集合"
                  disabled={!canEdit}
                  className="form-input"
                  value={attendanceForm.title}
                  onChange={(e) =>
                    setAttendanceForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </label>

              <button
                type="submit"
                disabled={!canEdit}
                className="mt-4 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                發起點名
              </button>
            </form>

            <div className="space-y-4">
              {attendanceEvents.length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
                  尚無點名事件。
                </p>
              )}

              {attendanceEvents.map((event) => {
                const arrivedCount = travelers.filter((traveler) => event.records?.[traveler.id]).length
                const missingCount = travelers.length - arrivedCount

                return (
                  <section key={event.id} className="rounded-2xl border border-slate-200 p-5">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
                        <p className="text-xs text-slate-400">建立於 {formatDateTime(event.createdAt)}</p>
                      </div>
                      <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        已到 {arrivedCount} / 未到 {missingCount}
                      </p>
                    </header>

                    <div className="mt-3 space-y-2">
                      {travelers.length === 0 && (
                        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-400">尚無團員。</p>
                      )}
                      {travelers.map((traveler) => (
                        <label
                          key={traveler.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50"
                        >
                          <span className="text-sm text-slate-700">
                            {traveler.name} ({traveler.phone})
                          </span>
                          <input
                            type="checkbox"
                            disabled={!canEdit}
                            checked={Boolean(event.records?.[traveler.id])}
                            onChange={(e) =>
                              handleAttendanceToggle(event.id, traveler.id, e.target.checked)
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>
        )}

        {/* 6. AI 行前評估 */}
        {activeTab === 'insights' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI 行前風險評估</h2>
                <p className="mt-1 text-sm text-slate-500">
                  天氣預測、景點人潮預測、團費成本預估，由 Gemini 結合 Google 搜尋生成。
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowAiInsightsModal(true)}
                  className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  {group.insights ? '重新評估' : '開始 AI 評估'}
                </button>
              )}
            </div>

            {!group.insights && (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">尚未產生評估結果。</p>
            )}

            {group.insights && (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900">天氣預測</h3>
                  <div className="mt-3 space-y-2">
                    {(group.insights.weather || []).map((w, i) => (
                      <div key={i} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                        <p className="font-semibold text-slate-900">
                          {w.date} · {w.condition}（{w.tempRange}）
                        </p>
                        <p className="mt-1 text-slate-600">{w.advice}</p>
                      </div>
                    ))}
                    {(!group.insights.weather || group.insights.weather.length === 0) && (
                      <p className="text-xs text-slate-400">無天氣資料。</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900">人潮預測</h3>
                  <div className="mt-3 space-y-2">
                    {(group.insights.crowd || []).map((c, i) => (
                      <div key={i} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                        <p className="font-semibold text-slate-900">
                          {c.location}（人潮：{c.level}）
                        </p>
                        <p className="mt-1 text-slate-600">{c.advice}</p>
                      </div>
                    ))}
                    {(!group.insights.crowd || group.insights.crowd.length === 0) && (
                      <p className="text-xs text-slate-400">無人潮資料。</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-bold text-slate-900">成本預估</h3>
                  {group.insights.cost && (
                    <>
                      <p className="mt-2 text-sm font-bold text-cyan-700">
                        每人約 {group.insights.cost.currency} {group.insights.cost.perPersonLow} -{' '}
                        {group.insights.cost.perPersonHigh}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {(group.insights.cost.breakdown || []).map((b, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                            <span className="font-semibold text-slate-800">{b.category}</span>
                            <span className="text-slate-600">{b.amount}</span>
                          </div>
                        ))}
                      </div>
                      {group.insights.cost.notes && (
                        <p className="mt-2 text-xs text-slate-500">{group.insights.cost.notes}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. 即時位置 */}
        {activeTab === 'live-map' && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-slate-900">即時位置監控</h2>
            <p className="mt-1 text-sm text-slate-500">查看所有團員的即時定位，掌握是否有人脫離安全區域。</p>
            <div className="mt-4">
              <AdminLiveMapView group={group} />
            </div>
          </div>
        )}

        {/* 8. 旅程後 */}
        {activeTab === 'post-trip' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handleRecommendationSubmit}>
              <h2 className="text-xl font-bold text-slate-900">推播新行程給家長／團員</h2>
              <p className="mt-1 text-xs text-slate-500">
                發布後將顯示在團員與家長的「旅程後」頁面通知列表中。
              </p>

              <label className="form-label mt-4">
                標題
                <input
                  required
                  disabled={!canEdit}
                  className="form-input"
                  value={recommendationForm.title}
                  onChange={(e) => setRecommendationForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </label>

              <label className="form-label mt-3">
                內容
                <textarea
                  required
                  rows={4}
                  disabled={!canEdit}
                  className="form-input"
                  value={recommendationForm.content}
                  onChange={(e) => setRecommendationForm((prev) => ({ ...prev, content: e.target.value }))}
                />
              </label>

              <label className="form-label mt-3">
                連結（選填）
                <input
                  disabled={!canEdit}
                  className="form-input"
                  placeholder="例如新行程的加入連結"
                  value={recommendationForm.linkUrl}
                  onChange={(e) => setRecommendationForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                />
              </label>

              <button
                type="submit"
                disabled={!canEdit || savingRecommendation}
                className="mt-4 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingRecommendation ? '推播中...' : '推播新行程通知'}
              </button>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-900">已推播列表</h3>
                <div className="mt-2 space-y-2">
                  {(group.recommendations || []).length === 0 && (
                    <p className="text-xs text-slate-400">尚未推播任何通知。</p>
                  )}
                  {(group.recommendations || []).map((r) => (
                    <div key={r.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                      <p className="font-semibold text-slate-900">{r.title}</p>
                      <p className="mt-1 text-slate-600">{r.content}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900">導遊滿意度回饋</h2>
              {(group.feedback || []).length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-400">尚無回饋。</p>
              ) : (
                <>
                  <div className="mt-3 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">平均滿意度</p>
                    <p className="mt-1 text-3xl font-black text-cyan-700">
                      {(group.feedback.reduce((sum, f) => sum + f.rating, 0) / group.feedback.length).toFixed(1)}
                      <span className="text-base font-semibold text-slate-400"> / 5（{group.feedback.length} 則）</span>
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {group.feedback.map((f) => (
                      <div key={f.id} className="rounded-lg border border-slate-200 p-3 text-xs">
                        <p className="font-semibold text-amber-600">
                          {'★'.repeat(f.rating)}
                          {'☆'.repeat(5 - f.rating)}
                        </p>
                        {f.comment && <p className="mt-1 text-slate-600">{f.comment}</p>}
                        <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(f.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* AI Modals */}
      <AiItineraryModal
        isOpen={showAiItineraryModal}
        onClose={() => setShowAiItineraryModal(false)}
        group={group}
        onApplied={() => setRefreshKey((x) => x + 1)}
      />

      <AiAnnouncementModal
        isOpen={showAiAnnouncementModal}
        onClose={() => setShowAiAnnouncementModal(false)}
        group={group}
        onDraftReady={(draft) => setAnnouncementForm(draft)}
      />

      <AiTripInsightsModal
        isOpen={showAiInsightsModal}
        onClose={() => setShowAiInsightsModal(false)}
        group={group}
        onSaved={() => setRefreshKey((x) => x + 1)}
      />
    </div>
  )
}

export default AdminGroupDetailPage
