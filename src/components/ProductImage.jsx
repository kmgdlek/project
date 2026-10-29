import { useImages } from '../lib/pixabay.js'

// 상품 이미지가 없으면 Pixabay에서 이름에 맞는 사진을 가져온다
const KEYWORDS = [
  ['한라봉', 'hallabong orange'],
  ['감귤', 'jeju tangerine'],
  ['흑돼지', 'grilled pork'],
  ['돌하르방', 'dolhareubang'],
]

function queryFor(name) {
  return KEYWORDS.find(([k]) => name.includes(k))?.[1] ?? 'jeju island'
}

export default function ProductImage({ product }) {
  const { images } = useImages(product.image_url ? '' : queryFor(product.name), 3)
  const src = product.image_url || images[0]?.webformatURL
  return src
    ? <img className="pimg" src={src} alt={product.name} loading="lazy" />
    : <div className="pimg skeleton" />
}
