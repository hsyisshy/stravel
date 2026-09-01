import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

function toCamelGroup(id, data = {}) {
  return {
    id: id,
    name: data.name || '',
    departureDate: data.departure_date || data.departureDate || '',
    returnDate: data.return_date || data.returnDate || '',
    meetingPoint: data.meeting_point || data.meetingPoint || '',
    meetingLat: typeof data.meeting_lat === 'number' ? data.meeting_lat : (data.meetingLat ?? null),
    meetingLng: typeof data.meeting_lng === 'number' ? data.meeting_lng : (data.meetingLng ?? null),
    safetyRadiusM: Number(data.safety_radius_m || data.safetyRadiusM) || 300,
    guideName: data.guide_name || data.guideName || '',
    guidePhone: data.guide_phone || data.guidePhone || '',
    notes: data.notes || '',
    adminToken: data.admin_token || data.adminToken || '',
    createdAt: data.created_at?.toDate ? data.created_at.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
  }
}

function toParticipant(id, data = {}) {
  return {
    id: id,
    name: data.name || '',
    phone: data.phone || '',
    notes: data.notes || '',
    joinedAt: data.joined_at?.toDate ? data.joined_at.toDate().toISOString() : (data.joinedAt || new Date().toISOString()),
  }
}

function toAnnouncement(id, data = {}) {
  return {
    id: id,
    title: data.title || '',
    content: data.content || '',
    pinned: Boolean(data.pinned),
    publishedAt: data.published_at?.toDate ? data.published_at.toDate().toISOString() : (data.publishedAt || new Date().toISOString()),
  }
}

function toItineraryItem(id, data = {}) {
  return {
    id: id,
    date: data.item_date || data.date || '',
    time: data.item_time || data.time || '',
    title: data.title || '',
    location: data.location || '',
    description: data.description || '',
    createdAt: data.created_at?.toDate ? data.created_at.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
  }
}

function toPhoto(id, data = {}) {
  return {
    id: id,
    participantId: data.participant_id || data.participantId || null,
    title: data.title || '',
    image: data.image_url || data.image || '',
    uploadedAt: data.uploaded_at?.toDate ? data.uploaded_at.toDate().toISOString() : (data.uploadedAt || new Date().toISOString()),
  }
}

function createAdminToken() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}


/**
 * 取得所有團體列表
 */
export async function getGroups() {
  const groupsRef = collection(db, 'groups')
  const q = query(groupsRef, orderBy('departure_date', 'asc'))
  const snapshot = await getDocs(q)

  const groupList = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const gData = docSnap.data()
      const participantsSnap = await getDocs(collection(db, 'groups', docSnap.id, 'participants'))
      return {
        ...toCamelGroup(docSnap.id, gData),
        travelers: participantsSnap.docs.map((p) => toParticipant(p.id, p.data())),
      }
    }),
  )

  return groupList
}

/**
 * 根據 groupId 取得完整團體資料（含行程、公告、團員、照片、點名）
 */
export async function getGroupById(groupId) {
  if (!groupId) return null

  const groupDocRef = doc(db, 'groups', groupId)
  const groupSnap = await getDoc(groupDocRef)

  if (!groupSnap.exists()) return null

  const [participantsSnap, announcementsSnap, itinerarySnap, photosSnap, eventsSnap, recordsSnap] =
    await Promise.all([
      getDocs(query(collection(db, 'groups', groupId, 'participants'), orderBy('joined_at', 'asc'))),
      getDocs(query(collection(db, 'groups', groupId, 'announcements'), orderBy('published_at', 'desc'))),
      getDocs(query(collection(db, 'groups', groupId, 'itinerary'), orderBy('item_date', 'asc'), orderBy('item_time', 'asc'))),
      getDocs(query(collection(db, 'groups', groupId, 'photos'), orderBy('uploaded_at', 'desc'))),
      getDocs(query(collection(db, 'groups', groupId, 'attendance_events'), orderBy('created_at', 'desc'))),
      getDocs(collection(db, 'groups', groupId, 'attendance_records')),
    ])

  const attendanceRecords = recordsSnap.docs.map((d) => d.data())

  const attendanceEventsWithRecords = eventsSnap.docs.map((eDoc) => {
    const eData = eDoc.data()
    const records = {}
    attendanceRecords
      .filter((record) => record.event_id === eDoc.id)
      .forEach((record) => {
        records[record.participant_id] = record.arrived
      })

    return {
      id: eDoc.id,
      title: eData.title || '',
      createdAt: eData.created_at?.toDate ? eData.created_at.toDate().toISOString() : new Date().toISOString(),
      records,
    }
  })

  return {
    ...toCamelGroup(groupSnap.id, groupSnap.data()),
    travelers: participantsSnap.docs.map((d) => toParticipant(d.id, d.data())),
    announcements: announcementsSnap.docs.map((d) => toAnnouncement(d.id, d.data())),
    itinerary: itinerarySnap.docs.map((d) => toItineraryItem(d.id, d.data())),
    photos: photosSnap.docs.map((d) => toPhoto(d.id, d.data())),
    attendanceEvents: attendanceEventsWithRecords,
  }
}

/**
 * 建立新旅遊團體
 */
export async function createGroup(payload) {
  const adminToken = createAdminToken()
  const groupsRef = collection(db, 'groups')
  const newDoc = doc(groupsRef)

  const groupData = {
    name: payload.name,
    departure_date: payload.departureDate,
    return_date: payload.returnDate,
    meeting_point: payload.meetingPoint,
    meeting_lat: payload.meetingLat ?? null,
    meeting_lng: payload.meetingLng ?? null,
    safety_radius_m: payload.safetyRadiusM || 300,
    guide_name: payload.guideName,
    guide_phone: payload.guidePhone,
    notes: payload.notes || '',
    admin_token: adminToken,
    created_at: serverTimestamp(),
  }

  await setDoc(newDoc, groupData)

  return toCamelGroup(newDoc.id, {
    ...groupData,
    created_at: new Date(),
  })
}

/**
 * 更新集合地點座標與安全半徑
 */
export async function updateGroupLocation(groupId, payload) {
  const groupRef = doc(db, 'groups', groupId)
  await updateDoc(groupRef, {
    meeting_lat: payload.meetingLat ?? null,
    meeting_lng: payload.meetingLng ?? null,
    safety_radius_m: payload.safetyRadiusM || 300,
  })

  const updatedSnap = await getDoc(groupRef)
  return toCamelGroup(groupId, updatedSnap.data())
}

/**
 * 旅客加入團體
 */
export async function addTraveler(groupId, payload) {
  const participantsRef = collection(db, 'groups', groupId, 'participants')
  const newDoc = doc(participantsRef)

  const travelerData = {
    name: payload.name,
    phone: payload.phone,
    notes: payload.notes || '',
    joined_at: serverTimestamp(),
  }

  await setDoc(newDoc, travelerData)

  // Initialize attendance records for existing events
  const eventsSnap = await getDocs(collection(db, 'groups', groupId, 'attendance_events'))
  if (!eventsSnap.empty) {
    await Promise.all(
      eventsSnap.docs.map(async (eDoc) => {
        const recordRef = doc(db, 'groups', groupId, 'attendance_records', `${eDoc.id}_${newDoc.id}`)
        await setDoc(recordRef, {
          group_id: groupId,
          event_id: eDoc.id,
          participant_id: newDoc.id,
          arrived: false,
        })
      }),
    )
  }

  return toParticipant(newDoc.id, {
    ...travelerData,
    joined_at: new Date(),
  })
}

/**
 * 移出團員
 */
export async function removeTraveler(groupId, participantId) {
  const travelerRef = doc(db, 'groups', groupId, 'participants', participantId)
  await deleteDoc(travelerRef)

  // Remove attendance records for this traveler
  const recordsSnap = await getDocs(
    query(collection(db, 'groups', groupId, 'attendance_records'), where('participant_id', '==', participantId)),
  )
  await Promise.all(recordsSnap.docs.map((d) => deleteDoc(d.ref)))

  return true
}

/**
 * 發布公告
 */
export async function addAnnouncement(groupId, payload) {
  const annRef = collection(db, 'groups', groupId, 'announcements')
  const newDoc = doc(annRef)

  const annData = {
    title: payload.title,
    content: payload.content,
    pinned: Boolean(payload.pinned),
    published_at: serverTimestamp(),
  }

  await setDoc(newDoc, annData)

  return toAnnouncement(newDoc.id, {
    ...annData,
    published_at: new Date(),
  })
}

/**
 * 新增行程項目
 */
export async function addItineraryItem(groupId, payload) {
  const itinRef = collection(db, 'groups', groupId, 'itinerary')
  const newDoc = doc(itinRef)

  const itemData = {
    item_date: payload.date,
    item_time: payload.time,
    title: payload.title,
    location: payload.location,
    description: payload.description || '',
    created_at: serverTimestamp(),
  }

  await setDoc(newDoc, itemData)

  return toItineraryItem(newDoc.id, {
    ...itemData,
    created_at: new Date(),
  })
}

/**
 * 批量新增行程項目
 */
export async function addMultipleItineraryItems(groupId, items) {
  if (!items || items.length === 0) return []

  const created = await Promise.all(
    items.map(async (item) => {
      const itinRef = collection(db, 'groups', groupId, 'itinerary')
      const newDoc = doc(itinRef)
      const itemData = {
        item_date: item.date,
        item_time: item.time,
        title: item.title,
        location: item.location || '',
        description: item.description || '',
        created_at: serverTimestamp(),
      }
      await setDoc(newDoc, itemData)
      return toItineraryItem(newDoc.id, { ...itemData, created_at: new Date() })
    }),
  )

  return created
}

/**
 * 刪除行程項目
 */
export async function deleteItineraryItem(groupId, itemId) {
  const itemRef = doc(db, 'groups', groupId, 'itinerary', itemId)
  await deleteDoc(itemRef)
  return true
}

function compressImageToBase64(file, maxWidth = 1000, maxHeight = 1000, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (typeof file === 'string') {
      return resolve(file)
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 上傳照片（以 Base64 壓縮儲存於 Firestore，免 Storage 額外設定）
 */
export async function addPhoto(groupId, payload) {
  const file = payload.file
  const dataUrl = await compressImageToBase64(file)

  const photosRef = collection(db, 'groups', groupId, 'photos')
  const newDoc = doc(photosRef)

  const photoData = {
    participant_id: payload.participantId || null,
    title: payload.title || '照片',
    image_url: dataUrl,
    uploaded_at: serverTimestamp(),
  }

  await setDoc(newDoc, photoData)

  return toPhoto(newDoc.id, {
    ...photoData,
    uploaded_at: new Date(),
  })
}

/**
 * 建立點名活動
 */
export async function addAttendanceEvent(groupId, payload) {
  const eventsRef = collection(db, 'groups', groupId, 'attendance_events')
  const newDoc = doc(eventsRef)

  const eventData = {
    title: payload.title,
    created_at: serverTimestamp(),
  }

  await setDoc(newDoc, eventData)

  const participantsSnap = await getDocs(collection(db, 'groups', groupId, 'participants'))
  if (!participantsSnap.empty) {
    await Promise.all(
      participantsSnap.docs.map(async (pDoc) => {
        const recordRef = doc(db, 'groups', groupId, 'attendance_records', `${newDoc.id}_${pDoc.id}`)
        await setDoc(recordRef, {
          group_id: groupId,
          event_id: newDoc.id,
          participant_id: pDoc.id,
          arrived: false,
        })
      }),
    )
  }

  return {
    id: newDoc.id,
    title: payload.title,
    createdAt: new Date().toISOString(),
    records: {},
  }
}

/**
 * 簽到打卡 / 更新點名狀態
 */
export async function setAttendanceStatus(groupId, eventId, travelerId, arrived) {
  const recordRef = doc(db, 'groups', groupId, 'attendance_records', `${eventId}_${travelerId}`)
  await setDoc(
    recordRef,
    {
      group_id: groupId,
      event_id: eventId,
      participant_id: travelerId,
      arrived: Boolean(arrived),
    },
    { merge: true },
  )

  return true
}

export function getAnnouncementFeed(group) {
  const announcements = group?.announcements || []
  return [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })
}

export function getItineraryFeed(group) {
  const itinerary = group?.itinerary || []
  return [...itinerary].sort((a, b) => {
    const aTs = new Date(`${a.date}T${a.time || '00:00'}`).getTime()
    const bTs = new Date(`${b.date}T${b.time || '00:00'}`).getTime()
    return aTs - bTs
  })
}

export function getPhotoFeed(group) {
  const photos = group?.photos || []
  return [...photos].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )
}

function participantStorageKey(groupId) {
  return `stravel:participant:${groupId}`
}

export function getStoredParticipantId(groupId) {
  try {
    return window.localStorage.getItem(participantStorageKey(groupId))
  } catch {
    return null
  }
}

export function storeParticipantId(groupId, participantId) {
  try {
    window.localStorage.setItem(participantStorageKey(groupId), participantId)
  } catch {
    // ignore
  }
}

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDate(dateLike) {
  if (!dateLike) return '-'
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(dateLike) {
  if (!dateLike) return '-'
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
