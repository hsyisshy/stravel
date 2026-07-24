import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  addAnnouncement,
  addAttendanceEvent,
  addItineraryItem,
  addPhoto,
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

const tabs = [
  { key: 'travelers', label: '團員名單' },
  { key: 'announcements', label: '公告區' },
  { key: 'itinerary', label: '行程一覽表' },
  { key: 'photos', label: '照片區' },
  { key: 'attendance', label: '點名功能' },
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
      setSavingError(err.message || '儲存集合地點座標失敗')
    } finally {
      setSavingLocation(false)
    }
  }

  function handleAttendanceToggle(eventId, travelerId, checked) {
    if (!canEdit) return
    setAttendanceStatus(groupId, eventId, travelerId, checked)
      .then(() => {
        setRefreshKey((x) => x + 1)
      })
      .catch((err) => {
        setSavingError(err.message || '更新點名狀態失敗')
      })
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{group.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(group.departureDate)} - {formatDate(group.returnDate)}
          </p>
        </div>
        <Link
          to={`/group/${group.id}`}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
        >
          預覽旅客頁
        </Link>
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
              <dd className="font-semibold text-slate-900">{group.guideName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">導遊電話</dt>
              <dd className="font-semibold text-slate-900">{group.guidePhone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">已加入旅客</dt>
              <dd className="font-semibold text-slate-900">{group.travelers?.length || 0} 人</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">備註</dt>
              <dd className="mt-1 rounded-xl bg-slate-50 p-3 text-slate-700">{group.notes || '-'}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-base font-bold text-slate-900">智慧定位設定</h3>
            <p className="mt-1 text-xs text-slate-500">
              點選地圖設定集合地點座標，旅客端會依此顯示安全範圍與距離提醒。
            </p>
            <div className="mt-3">
              <LocationPicker
                lat={locationForm.lat}
                lng={locationForm.lng}
                radiusM={locationForm.radiusM}
                onChange={({ lat, lng }) =>
                  canEdit && setLocationForm((prev) => ({ ...prev, lat, lng }))
                }
              />
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="form-label">
                安全範圍半徑（公尺）
                <input
                  type="number"
                  min="20"
                  step="10"
                  disabled={!canEdit}
                  className="form-input"
                  value={locationForm.radiusM}
                  onChange={(e) =>
                    setLocationForm((prev) => ({ ...prev, radiusM: Number(e.target.value) || 300 }))
                  }
                />
              </label>
              <button
                type="button"
                disabled={!canEdit || savingLocation}
                onClick={handleLocationSave}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingLocation ? '儲存中...' : '儲存座標設定'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">旅客加入 QR Code</h2>
          <div className="mt-4 flex justify-center rounded-xl bg-slate-50 p-4">
            <QRCodeSVG value={joinLink} size={190} />
          </div>
          <p className="mt-3 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {joinLink}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
              onClick={handleCopy}
            >
              複製連結
            </button>
            <Link
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400"
              to={joinPath}
              target="_blank"
            >
              開啟加入頁
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

        {activeTab === 'announcements' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handleAnnouncementSubmit}>
              <h2 className="text-xl font-bold text-slate-900">新增公告</h2>

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
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
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

        {activeTab === 'itinerary' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handleItinerarySubmit}>
              <h2 className="text-xl font-bold text-slate-900">新增行程項目</h2>

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
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                新增行程
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900">行程時間軸</h2>
              <div className="mt-4 space-y-3">
                {itineraryFeed.length === 0 && (
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">尚無行程項目。</p>
                )}
                {itineraryFeed.map((item) => (
                  <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-cyan-700">
                      {formatDate(item.date)} {item.time}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">地點: {item.location}</p>
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
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        {activeTab === 'attendance' && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <form className="rounded-2xl border border-slate-200 p-6" onSubmit={handleAttendanceCreate}>
              <h2 className="text-xl font-bold text-slate-900">建立點名事件</h2>

              <label className="form-label mt-4">
                事件名稱
                <input
                  required
                  placeholder="例如：機場集合、上遊覽車"
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
                className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                建立事件
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
                          className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
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
      </section>
    </div>
  )
}

export default AdminGroupDetailPage
