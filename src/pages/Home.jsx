import { Link } from 'react-router-dom'
import { useImages } from '../lib/pixabay.js'
import { useAuth } from '../context/AuthContext.jsx'
import ImageCard from '../components/ImageCard.jsx'

const SPOTS = [
  { q: 'hallasan', name: '한라산', desc: '해발 1,947m, 대한민국에서 가장 높은 산. 사계절 다른 얼굴을 보여줍니다.' },
  { q: 'seongsan ilchulbong', name: '성산일출봉', desc: '바다 위로 솟은 분화구. 새벽 일출 명소로 유네스코 세계자연유산입니다.' },
  { q: 'jeju waterfall', name: '폭포', desc: '정방·천지연 폭포처럼 바다와 맞닿은 시원한 물줄기를 만나보세요.' },
  { q: 'dolhareubang', name: '돌하르방', desc: '제주의 수호신. 현무암으로 빚은 친근한 얼굴이 섬을 지킵니다.' },
  { q: 'jeju tangerine', name: '감귤', desc: '겨울이면 섬 전체가 주황빛으로 물드는 제주의 대표 특산물.' },
  { q: 'jeju canola flower', name: '유채꽃', desc: '봄바람에 일렁이는 노란 물결, 제주의 봄을 알리는 풍경.' },
]

function Spot({ spot }) {
  const { images, loading } = useImages(spot.q, 3)
  const img = images[0]
  return (
    <div className="spot">
      {loading ? <div className="skeleton" /> : img ? <ImageCard image={img} /> : <div className="skeleton" />}
      <h3>{spot.name}</h3>
      <p>{spot.desc}</p>
    </div>
  )
}

export default function Home() {
  const { images } = useImages('jeju island sea', 5)
  const { user } = useAuth()
  const hero = images[0]

  return (
    <main>
      <section className="hero" style={hero ? { backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${hero.largeImageURL})` } : undefined}>
        <h1>바람, 돌, 바다의 섬<br />제주</h1>
        <p>화산이 빚은 풍경과 사람의 이야기가 있는 곳.</p>
        <Link className="btn big" to={user ? '/gallery' : '/signup'}>
          {user ? '갤러리 보러 가기' : '지금 시작하기'}
        </Link>
      </section>

      <section className="section">
        <h2>제주의 대표 풍경</h2>
        <div className="grid3">
          {SPOTS.map((s) => <Spot key={s.q} spot={s} />)}
        </div>
      </section>

      {!user && (
        <section className="section cta">
          <h2>더 많은 제주 사진이 궁금하다면?</h2>
          <p>회원가입 후 제주 갤러리를 자유롭게 탐색해 보세요.</p>
          <Link className="btn big" to="/signup">무료 회원가입</Link>
        </section>
      )}
    </main>
  )
}
