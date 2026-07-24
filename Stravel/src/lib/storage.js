import { supabase } from './supabase'

const UUID_V4_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuidLike(value) {
  return UUID_V4_LIKE_REGEX.test(String(value || '').trim())
}

function toCamelGroup(row) {
  return {
    id: row.id,
    name: row.name,
    departureDate: row.departure_date,
    returnDate: row.return_date,
    meetingPoint: row.meeting_point,
    meetingLat: row.meeting_lat,
    meetingLng: row.meeting_lng,
    safetyRadiusM: row.safety_radius_m,
    guideName: row.guide_name,
    guidePhone: row.guide_phone,
    notes: row.notes || '',
    adminToken: row.admin_token,
    createdAt: row.created_at,
  }
}

function toParticipant(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    notes: row.notes || '',
    joinedAt: row.joined_at,
  }
}

function toAnnouncement(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    pinned: row.pinned,
    publishedAt: row.published_at,
  }
}

function toItineraryItem(row) {
  return {
    id: row.id,
    date: row.item_date,
    time: row.item_time,
    title: row.title,
    location: row.location,
    description: row.description || '',
    createdAt: row.created_at,
  }
}

function toPhoto(row) {
  return {
    id: row.id,
    participantId: row.participant_id || null,
    title: row.title,
    image: row.image_url,
    uploadedAt: row.uploaded_at,
  }
}

function createAdminToken() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 9)
}

async function must(dataPromise) {
  const { data, error } = await dataPromise
  if (error) throw error
  return data
}

export async function getGroups() {
  const data = await must(
    supabase
      .from('groups')
      .select(
        'id,name,departure_date,return_date,meeting_point,meeting_lat,meeting_lng,safety_radius_m,guide_name,guide_phone,notes,admin_token,created_at,participants(id)',
      )
      .order('departure_date', { ascending: true }),
  )

  return (data || []).map((row) => ({
    ...toCamelGroup(row),
    travelers: row.participants || [],
  }))
}

export async function getGroupById(groupId) {
  if (!isUuidLike(groupId)) {
    return null
  }

  const groupRow = await must(
    supabase
      .from('groups')
      .select(
        'id,name,departure_date,return_date,meeting_point,meeting_lat,meeting_lng,safety_radius_m,guide_name,guide_phone,notes,admin_token,created_at',
      )
      .eq('id', groupId)
      .maybeSingle(),
  )

  if (!groupRow) return null

  const [participants, announcements, itineraryItems, photos, attendanceEvents, attendanceRecords] =
    await Promise.all([
      must(
        supabase
          .from('participants')
          .select('id,name,phone,notes,joined_at')
          .eq('group_id', groupId)
          .order('joined_at', { ascending: true }),
      ),
      must(
        supabase
          .from('announcements')
          .select('id,title,content,pinned,published_at')
          .eq('group_id', groupId)
          .order('published_at', { ascending: false }),
      ),
      must(
        supabase
          .from('itinerary_items')
          .select('id,item_date,item_time,title,location,description,created_at')
          .eq('group_id', groupId)
          .order('item_date', { ascending: true })
          .order('item_time', { ascending: true }),
      ),
      must(
        supabase
          .from('photos')
          .select('id,participant_id,title,image_url,uploaded_at')
          .eq('group_id', groupId)
          .order('uploaded_at', { ascending: false }),
      ),
      must(
        supabase
          .from('attendance_events')
          .select('id,title,created_at')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false }),
      ),
      must(
        supabase
          .from('attendance_records')
          .select('event_id,participant_id,arrived')
          .eq('group_id', groupId),
      ),
    ])

  const attendanceEventsWithRecords = (attendanceEvents || []).map((event) => {
    const records = {}
    ;(attendanceRecords || [])
      .filter((record) => record.event_id === event.id)
      .forEach((record) => {
        records[record.participant_id] = record.arrived
      })

    return {
      id: event.id,
      title: event.title,
      createdAt: event.created_at,
      records,
    }
  })

  return {
    ...toCamelGroup(groupRow),
    travelers: (participants || []).map(toParticipant),
    announcements: (announcements || []).map(toAnnouncement),
    itinerary: (itineraryItems || []).map(toItineraryItem),
    photos: (photos || []).map(toPhoto),
    attendanceEvents: attendanceEventsWithRecords,
  }
}

export async function createGroup(payload) {
  const adminToken = createAdminToken()
  const inserted = await must(
    supabase
      .from('groups')
      .insert({
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
      })
      .select(
        'id,name,departure_date,return_date,meeting_point,meeting_lat,meeting_lng,safety_radius_m,guide_name,guide_phone,notes,admin_token,created_at',
      )
      .single(),
  )

  return toCamelGroup(inserted)
}

export async function updateGroupLocation(groupId, payload) {
  const updated = await must(
    supabase
      .from('groups')
      .update({
        meeting_lat: payload.meetingLat ?? null,
        meeting_lng: payload.meetingLng ?? null,
        safety_radius_m: payload.safetyRadiusM || 300,
      })
      .eq('id', groupId)
      .select(
        'id,name,departure_date,return_date,meeting_point,meeting_lat,meeting_lng,safety_radius_m,guide_name,guide_phone,notes,admin_token,created_at',
      )
      .single(),
  )

  return toCamelGroup(updated)
}

export async function addTraveler(groupId, payload) {
  const traveler = await must(
    supabase
      .from('participants')
      .insert({
        group_id: groupId,
        name: payload.name,
        phone: payload.phone,
        notes: payload.notes || '',
      })
      .select('id,name,phone,notes,joined_at')
      .single(),
  )

  const events = await must(
    supabase.from('attendance_events').select('id').eq('group_id', groupId),
  )

  if (events?.length) {
    await must(
      supabase.from('attendance_records').insert(
        events.map((event) => ({
          group_id: groupId,
          event_id: event.id,
          participant_id: traveler.id,
          arrived: false,
        })),
      ),
    )
  }

  return toParticipant(traveler)
}

export async function addAnnouncement(groupId, payload) {
  const row = await must(
    supabase
      .from('announcements')
      .insert({
        group_id: groupId,
        title: payload.title,
        content: payload.content,
        pinned: Boolean(payload.pinned),
      })
      .select('id,title,content,pinned,published_at')
      .single(),
  )

  return toAnnouncement(row)
}

export async function addItineraryItem(groupId, payload) {
  const row = await must(
    supabase
      .from('itinerary_items')
      .insert({
        group_id: groupId,
        item_date: payload.date,
        item_time: payload.time,
        title: payload.title,
        location: payload.location,
        description: payload.description || '',
      })
      .select('id,item_date,item_time,title,location,description,created_at')
      .single(),
  )

  return toItineraryItem(row)
}

export async function addPhoto(groupId, payload) {
  const file = payload.file
  const ext = file.name?.split('.').pop() || 'jpg'
  const path = `${groupId}/${Date.now()}_${randomSuffix()}.${ext}`

  await must(
    supabase.storage.from('group-photos').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    }),
  )

  const { data: publicData } = supabase.storage.from('group-photos').getPublicUrl(path)

  const row = await must(
    supabase
      .from('photos')
      .insert({
        group_id: groupId,
        participant_id: payload.participantId || null,
        title: payload.title,
        image_url: publicData.publicUrl,
        storage_path: path,
      })
      .select('id,participant_id,title,image_url,uploaded_at')
      .single(),
  )

  return toPhoto(row)
}

export async function addAttendanceEvent(groupId, payload) {
  const event = await must(
    supabase
      .from('attendance_events')
      .insert({
        group_id: groupId,
        title: payload.title,
      })
      .select('id,title,created_at')
      .single(),
  )

  const participants = await must(
    supabase.from('participants').select('id').eq('group_id', groupId),
  )

  if (participants?.length) {
    await must(
      supabase.from('attendance_records').insert(
        participants.map((participant) => ({
          group_id: groupId,
          event_id: event.id,
          participant_id: participant.id,
          arrived: false,
        })),
      ),
    )
  }

  return {
    id: event.id,
    title: event.title,
    createdAt: event.created_at,
    records: {},
  }
}

export async function setAttendanceStatus(groupId, eventId, travelerId, arrived) {
  const existing = await must(
    supabase
      .from('attendance_records')
      .select('id')
      .eq('group_id', groupId)
      .eq('event_id', eventId)
      .eq('participant_id', travelerId)
      .maybeSingle(),
  )

  if (existing?.id) {
    await must(
      supabase
        .from('attendance_records')
        .update({ arrived: Boolean(arrived) })
        .eq('id', existing.id),
    )
  } else {
    await must(
      supabase.from('attendance_records').insert({
        group_id: groupId,
        event_id: eventId,
        participant_id: travelerId,
        arrived: Boolean(arrived),
      }),
    )
  }

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
    // localStorage unavailable (private mode, etc.) - ignore, feature degrades gracefully
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
