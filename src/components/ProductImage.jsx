import { useImages } from '../lib/pixabay.js'

// 상품 이미지가 없으면 Pixabay에서 이름에 맞는 사진을 가져온다
// 위에서부터 먼저 일치하는 항목이 쓰이므로 구체적인 단어를 위쪽에 둔다.
const KEYWORDS = [
  // 가공·간식 (감귤 같은 일반 단어보다 먼저 검사)
  ['초콜릿', 'chocolate'],
  ['주스', 'orange juice'],
  ['아이스크림', 'sorbet ice cream'],
  ['에이드', 'orange ade drink'],
  ['비누', 'handmade soap'],
  ['롤케이크', 'roll cake'],
  ['쿠키', 'cookies'],
  ['막걸리', 'makgeolli'],
  ['말차', 'matcha green tea'],
  ['녹차', 'green tea'],
  ['오메기떡', 'korean rice cake'],
  ['보리빵', 'bread'],
  ['땅콩', 'peanuts'],
  ['꿀', 'honey'],
  ['청귤', 'green tangerine'],
  ['한라봉 청', 'citrus jam jar'],
  ['동백', 'camellia flower'],
  ['백년초', 'prickly pear cactus'],
  ['돌하르방', 'dolhareubang'],
  ['키링', 'keychain'],
  // 수산물
  ['성게', 'sea urchin'],
  ['미역국', 'seaweed soup'],
  ['톳', 'seaweed'],
  ['미역', 'seaweed'],
  ['전복', 'abalone'],
  ['물회', 'sashimi'],
  ['고등어', 'grilled mackerel'],
  ['한치', 'dried squid'],
  ['오징어', 'dried squid'],
  ['갈치', 'hairtail fish'],
  ['옥돔', 'grilled fish'],
  // 육류·식사
  ['한우', 'korean beef'],
  ['흑돼지', 'grilled pork'],
  ['고기국수', 'pork noodle soup'],
  ['몸국', 'seaweed soup'],
  ['보말', 'noodle soup'],
  // 과일
  ['한라봉', 'dekopon orange'],
  ['천혜향', 'mandarin orange fruit'],
  ['레드향', 'mandarin orange fruit'],
  ['황금향', 'mandarin orange fruit'],
  ['망고', 'mango'],
  ['파인애플', 'pineapple'],
  ['감귤', 'tangerine'],
]

function queryFor(name) {
  return KEYWORDS.find(([k]) => name.includes(k))?.[1] ?? 'jeju island'
}

// 같은 검색어를 쓰는 상품끼리 사진이 겹치지 않도록 이름으로 고정된 순번을 만든다
function hash(str) {
  let h = 0
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

export default function ProductImage({ product }) {
  const { images } = useImages(product.image_url ? '' : queryFor(product.name), 12)
  const pool = images.slice(0, 6)
  const picked = pool.length ? pool[hash(product.name) % pool.length] : null
  const src = product.image_url || picked?.webformatURL
  return src
    ? <img className="pimg" src={src} alt={product.name} loading="lazy" />
    : <div className="pimg skeleton" />
}
