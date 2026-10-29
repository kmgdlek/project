import { useState } from 'react'
import { useImages } from '../lib/pixabay.js'
import ImageCard from '../components/ImageCard.jsx'

const TOPICS = [
  { q: 'jeju island', label: '전체' },
  { q: 'jeju beach', label: '바다' },
  { q: 'hallasan', label: '한라산' },
  { q: 'jeju oreum', label: '오름' },
  { q: 'jeju food', label: '음식' },
  { q: 'jeju tangerine', label: '감귤' },
]

export default function Gallery() {
  const [topic, setTopic] = useState(TOPICS[0].q)
  const { images, loading, error } = useImages(topic, 24)

  return (
    <main className="section">
      <h2>제주 갤러리</h2>
      <div className="chips">
        {TOPICS.map((t) => (
          <button key={t.q} className={`chip ${topic === t.q ? 'on' : ''}`} onClick={() => setTopic(t.q)}>
            {t.label}
          </button>
        ))}
      </div>
      {loading && <p className="center">불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      <div className="masonry">
        {images.map((img) => <ImageCard key={img.id} image={img} />)}
      </div>
    </main>
  )
}
