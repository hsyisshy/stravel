import { GoogleGenAI } from '@google/genai'

const STORAGE_KEY = 'stravel:gemini_api_key'

export function getGeminiApiKey() {
  try {
    const localKey = window.localStorage.getItem(STORAGE_KEY)
    if (localKey && localKey.trim()) return localKey.trim()
  } catch {
    // ignore
  }
  return import.meta.env.VITE_GEMINI_API_KEY || ''
}

export function setGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      window.localStorage.setItem(STORAGE_KEY, key.trim())
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}

export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey())
}

function getAiClient() {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('請先設定 Google Gemini API Key，即可啟用各項智慧功能！')
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * 1. AI 智慧排程生成器
 * 根據目的地、天數、旅遊風格與備註，產出結構化行程項目
 */
export async function generateItineraryAI({ destination, days, departureDate, style, notes }) {
  const ai = getAiClient()
  const prompt = `你是一位資深專業導遊兼旅遊規劃專家。請為旅遊團規劃一份細緻且流暢的旅遊行程。
【團體資訊】
- 目的地/主軸：${destination}
- 總天數：${days || 1} 天
- 出發日期：${departureDate || '2026-09-01'}
- 偏好風格/客群：${style || '經典大眾行程，老少咸宜'}
- 領隊特殊備註：${notes || '無'}

【輸出要求】
請回傳一個嚴格的 JSON Array，不要包含任何 markdown 標籤或額外文字。陣列中每個物件格式如下：
[
  {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "title": "行程名稱（簡短有力）",
    "location": "具體景點或餐廳名稱",
    "description": "行程亮點、集合叮嚀或導遊解說重點（約 30-60 字）"
  }
]
請注意：
1. 每天請安排 3-5 個合理的時間點（上午、午餐、下午、傍晚或晚餐），時間格式為 24 小時制（如 "09:00", "14:30"）。
2. 日期從 ${departureDate || '2026-09-01'} 起算連續 ${days || 1} 天。`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text?.trim() || '[]'
  try {
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Failed to parse Gemini itinerary JSON:', text, err)
    throw new Error('AI 生成行程格式解析失敗，請重試一次。')
  }
}

/**
 * 2. AI 突發狀況動態調程與應變公告草擬
 */
export async function replanItineraryAI({ currentItinerary, situation, targetDate, groupNotes }) {
  const ai = getAiClient()
  const prompt = `你是一位臨場應變能力極佳的專業領隊。現在旅行團發生了突發狀況，需要動態調整行程，並草擬安撫與告知團員的緊急公告。

【目前狀況】
- 突發狀況說明：${situation}
- 影響日期：${targetDate || '當日'}
- 目前原訂行程：
${JSON.stringify(currentItinerary || [], null, 2)}
- 團體背景備註：${groupNotes || '一般旅遊團'}

【任務】
1. 保留未受影響的合理行程，將受影響的景點/活動智能替換為鄰近合適的替代方案（如室內備案、延後時程、避開塞車路段）。
2. 撰寫一份語氣溫和、專業、清晰且能安撫團員情緒的【緊急/重要公告】。

【輸出要求】
請回傳一個嚴格的 JSON 物件，格式如下：
{
  "explanation": "給領隊的應變建議與調程邏輯（約 60-100 字）",
  "revisedItinerary": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "title": "調整後行程名稱",
      "location": "新地點/餐廳",
      "description": "變更說明或體驗重點"
    }
  ],
  "announcementDraft": {
    "title": "公告標題（如：【重要行程異動通知】因午後雷雨調整下午行程）",
    "content": "給團員看的完整公告內容，包含變更原因、新集合時間地點、貼心提醒。"
  }
}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.6,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text?.trim() || '{}'
  try {
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Failed to parse Gemini replan JSON:', text, err)
    throw new Error('AI 調程解析失敗，請重試一次。')
  }
}

/**
 * 3. AI 公告撰寫與潤飾助手
 */
export async function draftAnnouncementAI({ rawTopic, category, groupInfo }) {
  const ai = getAiClient()
  const prompt = `你是一位貼心且高效率的專業導遊。請根據以下重點草擬一篇給旅遊團員的即時公告。
【公告類型】：${category || '集合與行程提醒'}
【重點草稿/事項】：${rawTopic}
【團體資訊】：團名「${groupInfo?.name || '旅遊團'}」，導遊「${groupInfo?.guideName || '導遊'}」

【輸出要求】
請回傳嚴格 JSON：
{
  "title": "吸引人且明確的標題（可帶有適當 Emoji）",
  "content": "條理分明、語氣溫暖有禮的公告全文，包含重點標註與貼心小提醒。"
}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text?.trim() || '{}'
  try {
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Failed to parse Gemini announcement JSON:', text, err)
    throw new Error('AI 公告草擬失敗，請重試。')
  }
}

/**
 * 4. 多模態拍照識景 + AI 語音導覽解說 (Multimodal Vision)
 */
export async function narrateLandmarkAI({ imageBase64, mimeType = 'image/jpeg', locationName, userQuestion, groupInfo }) {
  const ai = getAiClient()

  const systemInstruction = `你是一位博學多聞、說話生動風趣的「AI 智慧個人專屬隨身導遊」。
你的任務是透過旅客拍攝的照片或所在地點，提供身歷其境、深入淺出的語音導覽解說。
解說風格：活潑、引人入勝、富含文化歷史典故但淺顯易懂，適合隨身聆聽。`

  const contents = []
  
  if (imageBase64) {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
    contents.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    })
  }

  const promptText = `請辨識這張照片中的景點、建築、文物、美食或標誌（若無照片則針對地點「${locationName || '當前旅遊景點'}」解說）。
旅客問題/想了解的事項：${userQuestion || '請為我進行全方位導覽解說、歷史故事與拍照建議'}。
團名/行程背景：${groupInfo?.name || '觀光行程'}。

請以繁體中文（台灣）回傳嚴格 JSON 物件：
{
  "landmarkName": "景點/物件正確名稱",
  "subtitle": "一句話浪漫或震撼的副標題",
  "summary": "100 字內的精彩摘要（適合快速瀏覽）",
  "audioStory": "適合用自然口吻朗讀的語音導覽講稿（約 200-350 字，口語化、有沉浸感）",
  "funTrivia": "一則不為人知的冷知識或歷史趣聞（約 60 字）",
  "photoTips": "最佳拍攝角度或取景小秘訣",
  "etiquette": "參觀注意事項或在地文化禮儀禁忌（如有）"
}`

  contents.push(promptText)

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text?.trim() || '{}'
  try {
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Failed to parse Gemini landmark narration JSON:', text, err)
    throw new Error('AI 景點辨識與導覽解析失敗，請重試一次。')
  }
}

/**
 * 5. 專屬團務 RAG AI 智能小幫手 (Chatbot)
 */
export async function chatTourAssistantAI({ message, history = [], groupContext }) {
  const ai = getAiClient()

  const contextPrompt = `你是在地專業「Stravel 智慧隨行領隊小幫手」。你正在為「${groupContext?.name || '旅遊團'}」的團員提供 24 小時貼心解答。

【當前團務即時資訊 (Grounding Data)】
- 團名：${groupContext?.name || '-'}
- 出發/回程日期：${groupContext?.departureDate || '-'} 至 ${groupContext?.returnDate || '-'}
- 集合地點：${groupContext?.meetingPoint || '-'} (安全範圍半徑: ${groupContext?.safetyRadiusM || 300}公尺)
- 帶團導遊：${groupContext?.guideName || '-'} (電話: ${groupContext?.guidePhone || '-'})
- 領隊重要備註：${groupContext?.notes || '無'}
- 置頂/最新公告列表：
${(groupContext?.announcements || []).map((a) => `• [${a.pinned ? '置頂' : '一般'}] ${a.title}: ${a.content}`).join('\n') || '暫無公告'}
- 行程表一覽：
${(groupContext?.itinerary || []).map((i) => `• ${i.date} ${i.time} - ${i.title} (${i.location}): ${i.description}`).join('\n') || '暫無行程項目'}

【你的回答原則】
1. 請嚴格根據上方提供的團務與行程資訊回答旅客問題（例如集合時間、地點、導遊電話、當日行程等）。
2. 若旅客詢問行程以外的生活常識（如天氣穿著、在地美食推薦、退稅流程等），可以給予專業熱情的旅遊建議，並貼心提醒注意集合時間。
3. 若遇到緊急走失、突發意外，請優先安撫情緒，並提供導遊電話 (${groupContext?.guidePhone || '緊急專線'}) 與集合點指引。
4. 請使用親切熱情、繁體中文（台灣）口吻回覆，格式排版清爽，多用條列與 Emoji。`

  const contents = [
    { role: 'user', parts: [{ text: '你好！我是本團團員。' }] },
    { role: 'model', parts: [{ text: `您好！我是您的 Stravel 隨行 AI 領隊小幫手 😊 很高興為您服務！無論是集合時間、行程詢問或是景點建議，隨時都可以問我喔！` }] },
  ]

  for (const h of history) {
    if (h.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: h.text }] })
    } else if (h.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: h.text }] })
    }
  }

  contents.push({ role: 'user', parts: [{ text: message }] })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      systemInstruction: contextPrompt,
      temperature: 0.7,
    },
  })

  return response.text?.trim() || '很抱歉，我目前暫時無法取得回應，請稍後再試。'
}

/**
 * 6. 多模態 AI 旅遊回憶錄與日誌生成器 (Travel Memory Story)
 */
export async function generateTravelStoryAI({ photos = [], itinerary = [], groupInfo, tone = '感人溫馨' }) {
  const ai = getAiClient()

  const prompt = `你是一位榮獲國家地理旅遊雜誌獎項的旅行作家。請為本團旅客撰寫一份充滿回憶溫度的「旅程專屬圖文回憶錄」。

【旅程資料】
- 團名：${groupInfo?.name || '我們的旅程'}
- 導遊：${groupInfo?.guideName || '專業領隊'}
- 旅行日期：${groupInfo?.departureDate} ~ ${groupInfo?.returnDate}
- 實際造訪亮點：
${(itinerary || []).map((i) => `• ${i.date} ${i.title} (${i.location})`).join('\n') || '各精選景點'}
- 團員上傳相片數量：${photos.length} 張精彩照片
- 寫作風格：${tone}

【輸出要求】
請回傳嚴格 JSON 格式：
{
  "storyTitle": "富有詩意或社群感的旅程主題標題",
  "lead": "一段引人入勝的開場引言（約 80 字）",
  "dailyHighlights": [
    {
      "dayTitle": "Day 1 / 第一站的專屬章節標題",
      "story": "描繪當時景色、美食與歡笑聲的生動段落（約 100-150 字）",
      "bestMemoryQuote": "一句代表此段回憶的金句"
    }
  ],
  "epilogue": "給全體團員的結語與下一次再出發的期許（約 100 字）",
  "socialMediaCaption": "適合直接複製到 Instagram / Facebook 的精緻文案（含熱門 Hashtags）"
}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.8,
      responseMimeType: 'application/json',
    },
  })

  const text = response.text?.trim() || '{}'
  try {
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    return JSON.parse(cleaned)
  } catch (err) {
    console.error('Failed to parse Gemini memory story JSON:', text, err)
    throw new Error('AI 回憶錄生成失敗，請重試一次。')
  }
}
