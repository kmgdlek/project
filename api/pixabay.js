// Vercel Serverless Function: Pixabay API 키를 서버에서만 사용하기 위한 프록시
export default async function handler(req, res) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return res.status(500).json({ error: 'PIXABAY_API_KEY is not set' })

  const { q = 'jeju island', per_page = '12', page = '1' } = req.query
  const params = new URLSearchParams({
    key,
    q: String(q).slice(0, 100),
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: String(Math.min(Number(per_page) || 12, 50)),
    page: String(Number(page) || 1),
  })

  try {
    const r = await fetch(`https://pixabay.com/api/?${params}`)
    if (!r.ok) return res.status(r.status).json({ error: `Pixabay error ${r.status}` })
    const data = await r.json()
    const hits = (data.hits || []).map((h) => ({
      id: h.id,
      tags: h.tags,
      user: h.user,
      pageURL: h.pageURL,
      previewURL: h.previewURL,
      webformatURL: h.webformatURL,
      largeImageURL: h.largeImageURL,
    }))
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600')
    return res.status(200).json({ total: data.totalHits, hits })
  } catch (e) {
    return res.status(502).json({ error: 'Failed to reach Pixabay' })
  }
}
