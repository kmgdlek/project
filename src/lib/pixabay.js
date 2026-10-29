import { useEffect, useState } from 'react'

const cache = new Map()

export async function fetchImages(q, perPage = 12) {
  const key = `${q}|${perPage}`
  if (cache.has(key)) return cache.get(key)
  const res = await fetch(`/api/pixabay?q=${encodeURIComponent(q)}&per_page=${perPage}`)
  if (!res.ok) throw new Error('이미지를 불러오지 못했습니다.')
  const data = await res.json()
  cache.set(key, data.hits)
  return data.hits
}

export function useImages(q, perPage = 12) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    fetchImages(q, perPage)
      .then((hits) => alive && setImages(hits))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [q, perPage])

  return { images, loading, error }
}
