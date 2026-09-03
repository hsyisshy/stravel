async function callGeminiApi(action, payload) {
  let res
  try {
    res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
  } catch {
    throw new Error('無法連線到 AI 服務，請確認網路連線後再試。')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'AI 服務暫時發生錯誤，請稍後再試。')
  }
  return data.result
}

/**
 * 1. AI 智慧排程生成器
 */
export async function generateItineraryAI(payload) {
  return callGeminiApi('generateItinerary', payload)
}

/**
 * 2. AI 突發狀況動態調程與應變公告草擬
 */
export async function replanItineraryAI(payload) {
  return callGeminiApi('replanItinerary', payload)
}

/**
 * 3. AI 公告撰寫與潤飾助手
 */
export async function draftAnnouncementAI(payload) {
  return callGeminiApi('draftAnnouncement', payload)
}

/**
 * 4. 多模態拍照識景 + AI 語音導覽解說 (Multimodal Vision)
 */
export async function narrateLandmarkAI(payload) {
  return callGeminiApi('narrateLandmark', payload)
}

/**
 * 5. 專屬團務 RAG AI 智能小幫手 (Chatbot)
 */
export async function chatTourAssistantAI(payload) {
  return callGeminiApi('chatTourAssistant', payload)
}

/**
 * 6. 多模態 AI 旅遊回憶錄與日誌生成器 (Travel Memory Story)
 */
export async function generateTravelStoryAI(payload) {
  return callGeminiApi('generateTravelStory', payload)
}
