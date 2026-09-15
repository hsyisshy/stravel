/**
 * 建立一個含 20 位假學生資料的示範行程，供現場 demo 使用。
 * 會建立團體、20 名團員、即時定位（部分在安全範圍內、部分脫離範圍）、
 * 行程、公告與一場點名活動，方便直接展示導遊後台「即時位置」面板。
 *
 * 用法： node scripts/seed-demo-group.mjs
 */
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCkdQhdXcIzrNVRCntLLduZGU0OpYXdCO4',
  authDomain: 'fir-travel-51872.firebaseapp.com',
  projectId: 'fir-travel-51872',
  storageBucket: 'fir-travel-51872.firebasestorage.app',
  messagingSenderId: '39211497808',
  appId: '1:39211497808:web:bc1a1db443e733eb15d455',
  measurementId: 'G-5PERYMSDXX',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

function createAdminToken() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// 九份老街遊客中心（集合地點）
const MEETING_LAT = 25.1097
const MEETING_LNG = 121.8446
const SAFETY_RADIUS_M = 250

const STUDENT_NAMES = [
  '陳品妍', '林彥廷', '黃詩涵', '張書豪', '李佳穎',
  '吳承翰', '劉子晴', '楊宗翰', '蔡宜蓁', '鄭又誠',
  '許雅筑', '郭承恩', '謝欣妤', '賴柏睿', '洪于婷',
  '周冠宇', '徐子涵', '何品睿', '曾詩穎', '蕭立言',
]

// 前 15 位在安全範圍內、後 5 位脫離範圍，方便 demo 時對照即時位置面板
const OUTSIDE_COUNT = 5

function metersToLatLngOffset(lat, distanceM, bearingDeg) {
  const bearingRad = (bearingDeg * Math.PI) / 180
  const dLat = (distanceM * Math.cos(bearingRad)) / 111320
  const dLng = (distanceM * Math.sin(bearingRad)) / (111320 * Math.cos((lat * Math.PI) / 180))
  return { dLat, dLng }
}

function randomPointAround(lat, lng, minM, maxM) {
  const distanceM = minM + Math.random() * (maxM - minM)
  const bearingDeg = Math.random() * 360
  const { dLat, dLng } = metersToLatLngOffset(lat, distanceM, bearingDeg)
  return { lat: lat + dLat, lng: lng + dLng }
}

async function main() {
  const adminToken = createAdminToken()
  const groupsRef = collection(db, 'groups')
  const groupDoc = doc(groupsRef)
  const groupId = groupDoc.id

  console.log(`建立示範團體 ${groupId} ...`)

  await setDoc(groupDoc, {
    name: '【現場示範】九份老街深度一日遊',
    departure_date: '2026-11-12',
    return_date: '2026-11-12',
    meeting_point: '九份老街遊客中心',
    meeting_lat: MEETING_LAT,
    meeting_lng: MEETING_LNG,
    safety_radius_m: SAFETY_RADIUS_M,
    guide_name: '王雅婷 (Cathy)',
    guide_phone: '0955-123-456',
    notes: '• 山區石階濕滑請穿防滑鞋\n• 午後山區易起霧偶有陣雨，請攜帶輕便雨具\n• 自由活動時間請隨身開啟遊點易思智慧定位',
    admin_token: adminToken,
    created_at: serverTimestamp(),
  })

  const participantIds = []
  console.log('新增 20 位學生團員 ...')
  for (let i = 0; i < STUDENT_NAMES.length; i += 1) {
    const participantsRef = collection(db, 'groups', groupId, 'participants')
    const pDoc = doc(participantsRef)
    const phoneSuffix = String(1000 + i).padStart(4, '0')
    await setDoc(pDoc, {
      name: STUDENT_NAMES[i],
      phone: `09${String(10 + i).padStart(2, '0')}-${phoneSuffix.slice(0, 3)}-${phoneSuffix.slice(3)}${i % 10}`,
      notes: '',
      role: 'traveler',
      guardian_of_id: null,
      joined_at: serverTimestamp(),
    })
    participantIds.push(pDoc.id)
  }

  console.log('寫入即時定位（部分在範圍內、部分脫離範圍）...')
  for (let i = 0; i < participantIds.length; i += 1) {
    const isOutside = i >= participantIds.length - OUTSIDE_COUNT
    const point = isOutside
      ? randomPointAround(MEETING_LAT, MEETING_LNG, SAFETY_RADIUS_M * 1.4, SAFETY_RADIUS_M * 3)
      : randomPointAround(MEETING_LAT, MEETING_LNG, 15, SAFETY_RADIUS_M * 0.85)

    const locRef = doc(db, 'groups', groupId, 'liveLocations', participantIds[i])
    await setDoc(locRef, {
      lat: point.lat,
      lng: point.lng,
      updated_at: serverTimestamp(),
    })
  }

  console.log('新增行程 ...')
  const itineraryItems = [
    { date: '2026-11-12', time: '09:00', title: '集合出發', location: '九份老街遊客中心', description: '請提前 10 分鐘抵達集合點名。' },
    { date: '2026-11-12', time: '10:00', title: '九份老街步行導覽', location: '九份老街', description: '沿豎崎路階梯認識礦業歷史與茶樓建築。' },
    { date: '2026-11-12', time: '12:00', title: '午餐時間', location: '阿妹茶樓周邊', description: '自由用餐，13:30 準時於老街入口集合。' },
    { date: '2026-11-12', time: '14:30', title: '十分瀑布景點導覽', location: '十分瀑布', description: '欣賞台灣最大簾幕式瀑布，注意步道濕滑。' },
  ]
  for (const item of itineraryItems) {
    const itinRef = collection(db, 'groups', groupId, 'itinerary')
    await setDoc(doc(itinRef), {
      item_date: item.date,
      item_time: item.time,
      title: item.title,
      location: item.location,
      description: item.description,
      created_at: serverTimestamp(),
    })
  }

  console.log('發布公告 ...')
  const annRef = collection(db, 'groups', groupId, 'announcements')
  await setDoc(doc(annRef), {
    title: '行前重要提醒',
    content: '明天九份山區午後易起霧偶有陣雨，請攜帶輕便雨具並穿著防滑鞋。集合時間為 09:00，請務必準時，遲到將影響全團行程！',
    pinned: true,
    published_at: serverTimestamp(),
  })

  console.log('建立點名活動 ...')
  const eventsRef = collection(db, 'groups', groupId, 'attendance_events')
  const eventDoc = doc(eventsRef)
  await setDoc(eventDoc, {
    title: '老街入口第一次集合點名',
    created_at: serverTimestamp(),
  })
  for (let i = 0; i < participantIds.length; i += 1) {
    const isOutside = i >= participantIds.length - OUTSIDE_COUNT
    const recordRef = doc(db, 'groups', groupId, 'attendance_records', `${eventDoc.id}_${participantIds[i]}`)
    await setDoc(recordRef, {
      group_id: groupId,
      event_id: eventDoc.id,
      participant_id: participantIds[i],
      arrived: !isOutside,
    })
  }

  console.log('\n完成！示範團體已建立：')
  console.log(`  團體 ID     : ${groupId}`)
  console.log(`  Admin Token : ${adminToken}`)
  console.log(`  導遊後台   : https://fir-travel-51872.web.app/admin/groups/${groupId}?token=${adminToken}`)
  console.log(`  旅客加入   : https://fir-travel-51872.web.app/group/${groupId}/join`)
  console.log(`  本機導遊後台: http://localhost:5183/admin/groups/${groupId}?token=${adminToken}`)
  console.log(`  本機旅客頁  : http://localhost:5183/group/${groupId}/join`)

  process.exit(0)
}

main().catch((err) => {
  console.error('建立示範資料失敗：', err)
  process.exit(1)
})
