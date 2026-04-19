const pLimit = require('p-limit').default
const { createClient } = require('@supabase/supabase-js')

// ── 설정 ──────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://skmnlekamfuuevcolluz.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const CONCURRENCY  = parseInt(process.env.CONCURRENCY || '3')
const ID_FROM      = parseInt(process.env.ID_FROM || '1000')
const ID_TO        = parseInt(process.env.ID_TO || '7229')
const SEARCH_TERM  = encodeURIComponent('닭꼬치')
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const limit = pLimit(CONCURRENCY)

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
}

// ── 유틸 ──────────────────────────────────────────
async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// 429 시 5분 대기 후 재시도
async function fetchHtml(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: HEADERS })
    if (res.ok) return res.text()
    if (res.status === 429) {
      console.log(`  ⚠ 429 rate limit, 5분 대기... (시도 ${i + 1}/${retries})`)
      await sleep(5 * 60 * 1000)
      continue
    }
    console.log(`  ✗ HTTP ${res.status}: ${url.slice(0, 80)}`)
    return null
  }
  console.log(`  ✗ 최대 재시도 초과: ${url.slice(0, 80)}`)
  return null
}

function parseRemixContext(html) {
  const remixIdx = html.indexOf('__remixContext')
  if (remixIdx < 0) return null
  const start = html.indexOf('{', remixIdx)
  if (start < 0) return null
  let depth = 0, end = start
  for (let i = start; i < Math.min(start + 500000, html.length); i++) {
    if (html[i] === '{') depth++
    else if (html[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  try { return JSON.parse(html.slice(start, end + 1)) } catch { return null }
}

// ── 이미 수집한 post_id 목록 로드 ─────────────────
async function loadCrawledIds() {
  const { data } = await supabase.from('crawled_posts').select('post_id')
  return new Set((data || []).map(r => r.post_id))
}

// ── 이미 등록된 주소 목록 로드 ────────────────────
async function loadExistingAddresses() {
  const { data } = await supabase.from('locations').select('address')
  return new Set((data || []).map(r => r.address))
}

// ── 목록 페이지에서 게시글 URL 추출 ───────────────
function parsePostUrls(html) {
  const matches = [...html.matchAll(/href="(\/kr\/community\/[^"]+)"/g)]
  const urls = []
  for (const m of matches) {
    const href = m[1]
    if (href.includes('/s/') || href.includes('?')) continue
    const match = href.match(/\/kr\/community\/.+-([a-z0-9]+)\/?$/)
    if (match) urls.push({ url: `https://www.daangn.com${href}`, postId: match[1] })
  }
  return [...new Map(urls.map(u => [u.postId, u])).values()]
}

// ── 상세 페이지에서 placeTag + createdAt 추출 ─────
function extractPlace(html) {
  const ctx = parseRemixContext(html)
  if (!ctx) return null

  const loaderData = ctx.state?.loaderData
  if (!loaderData) return null

  const routeKey = Object.keys(loaderData).find(k => k !== 'root')
  if (!routeKey) return null

  const article = loaderData[routeKey]?.data?.communityArticle
  if (!article?.placeTag) return null

  // 최근 6개월 필터
  const createdAt = new Date(article.createdAt)
  if (Date.now() - createdAt.getTime() > SIX_MONTHS_MS) return null

  const tag = article.placeTag
  if (!tag.placeTagLatitude || !tag.placeTagLongitude) return null

  return {
    placeName: tag.placeTagTitle || '닭꼬치',
    address: tag.address || tag.jibunAddress || '',
    lat: tag.placeTagLatitude,
    lng: tag.placeTagLongitude,
  }
}

// ── Supabase에 저장 ────────────────────────────────
async function saveLocation({ postId, neighborhoodId, place, postUrl, existingAddresses }) {
  await supabase.from('crawled_posts').upsert({
    post_id: postId,
    neighborhood_id: neighborhoodId,
    crawled_at: new Date().toISOString(),
  })

  // 주소 중복 체크
  if (existingAddresses.has(place.address)) return false

  await supabase.from('locations').insert({
    type: 'chicken_skewer',
    name: place.placeName,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    description: `당근마켓 제보: ${postUrl}`,
    status: 'approved',
  })

  existingAddresses.add(place.address)
  return true
}

// ── 동네 하나 처리 ────────────────────────────────
async function processNeighborhood(id, crawledIds, existingAddresses) {
  const listUrl = `https://www.daangn.com/kr/community/s/?in=%EC%A7%80%EC%82%B01%EB%8F%99-${id}&search=${SEARCH_TERM}`
  const html = await fetchHtml(listUrl)
  if (!html) return 0

  const posts = parsePostUrls(html).filter(p => !crawledIds.has(p.postId))
  if (!posts.length) return 0

  await sleep(2000)  // 동네 간 2초 간격

  let saved = 0
  for (const { url, postId } of posts) {
    await sleep(1500)  // 게시글 간 1.5초 간격
    const postHtml = await fetchHtml(url)
    if (!postHtml) continue

    const place = extractPlace(postHtml)
    if (!place) {
      await supabase.from('crawled_posts').upsert({
        post_id: postId,
        neighborhood_id: id,
        crawled_at: new Date().toISOString(),
      })
      crawledIds.add(postId)
      continue
    }

    const inserted = await saveLocation({ postId, neighborhoodId: id, place, postUrl: url, existingAddresses })
    crawledIds.add(postId)
    if (inserted) {
      saved++
      console.log(`  ✓ [${id}] ${place.placeName} | ${place.address}`)
    } else {
      console.log(`  - [${id}] 중복 주소 스킵: ${place.address}`)
    }
  }
  return saved
}

// ── 메인 ──────────────────────────────────────────
async function main() {
  console.log('크롤링 시작...')

  const [crawledIds, existingAddresses] = await Promise.all([
    loadCrawledIds(),
    loadExistingAddresses(),
  ])
  console.log(`기존 수집 게시글: ${crawledIds.size}개 / 기존 등록 주소: ${existingAddresses.size}개`)

  const ids = Array.from({ length: ID_TO - ID_FROM + 1 }, (_, i) => ID_FROM + i)
  let total = 0

  await Promise.all(
    ids.map(id =>
      limit(async () => {
        const count = await processNeighborhood(id, crawledIds, existingAddresses)
        if (count > 0) {
          total += count
          console.log(`[${id}] 신규 ${count}개 저장`)
        }
      })
    )
  )

  console.log(`완료! 총 ${total}개 새 위치 저장`)
}

main().catch(console.error)
