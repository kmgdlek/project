import { lonLat } from './geo.js'
import { heightAt, snapToLand } from './terrain.js'

export const LAYERS = [
  { key: 'spot', label: '관광지', color: '#ef4444' },
  { key: 'oreum', label: '오름', color: '#8b5cf6' },
  { key: 'olle', label: '올레길', color: '#f43f5e' },
  { key: 'port', label: '항·포구', color: '#2563eb' },
  { key: 'tangerine', label: '감귤 재배지', color: '#f97316' },
  { key: 'wind', label: '풍력발전기', color: '#10b981' },
  { key: 'lighthouse', label: '등대', color: '#eab308' },
  { key: 'dolhareubang', label: '돌하르방', color: '#6b7280' },
]

// [layer, name, lon, lat, desc, pixabay query]
const RAW = [
  ['spot', '한라산 백록담', 126.533, 33.362, '해발 1,947m. 정상의 화구호 백록담을 품은 대한민국 최고봉.', 'hallasan'],
  ['spot', '성산일출봉', 126.942, 33.458, '바다에서 솟아오른 수성화산 분화구. 일출 명소이자 유네스코 세계자연유산.', 'seongsan ilchulbong'],
  ['spot', '우도', 126.951, 33.506, '소가 누운 모습을 닮은 동쪽의 부속 섬. 땅콩과 해안 풍경으로 유명합니다.', 'udo island jeju'],
  ['spot', '천지연폭포', 126.554, 33.246, '서귀포 시내 가까이 쏟아지는 22m 폭포.', 'cheonjiyeon waterfall'],
  ['spot', '정방폭포', 126.571, 33.244, '바다로 직접 떨어지는 동양 유일의 해안 폭포.', 'jeongbang waterfall'],
  ['spot', '중문·대포 주상절리대', 126.425, 33.238, '용암이 식으며 만든 육각 기둥 절벽.', 'jusangjeolli'],
  ['spot', '산방산', 126.314, 33.239, '종 모양으로 솟은 거대한 용암 돔. 아래에 용머리해안이 이어집니다.', 'sanbangsan'],
  ['spot', '협재해변', 126.239, 33.394, '에메랄드빛 바다와 비양도가 보이는 서쪽 해변.', 'hyeopjae beach'],
  ['spot', '용두암', 126.512, 33.516, '용이 바다로 솟는 모습을 닮은 해안 바위.', 'yongduam jeju'],
  ['spot', '만장굴', 126.771, 33.528, '약 7km에 이르는 세계적 규모의 용암동굴.', 'manjanggul'],
  ['spot', '섭지코지', 126.93, 33.424, '성산 앞바다로 뻗은 곶. 유채꽃과 등대가 어우러집니다.', 'seopjikoji'],

  ['oreum', '새별오름', 126.358, 33.364, '들불축제로 알려진 서쪽 평원의 오름.', 'saebyeol oreum'],
  ['oreum', '다랑쉬오름', 126.804, 33.482, '"오름의 여왕"이라 불리는 깊은 굼부리의 오름.', 'darangshi oreum'],
  ['oreum', '용눈이오름', 126.831, 33.446, '부드러운 능선이 인상적인 동부의 오름.', 'yongnuni oreum'],
  ['oreum', '거문오름', 126.71, 33.447, '용암동굴계를 만든 분화구. 세계자연유산 구역.', 'geomunoreum'],
  ['oreum', '송악산', 126.289, 33.205, '남서쪽 해안의 오름. 마라도와 가파도가 보입니다.', 'songaksan'],

  ['olle', '올레 1코스 (시흥~광치기)', 126.907, 33.466, '올레길의 시작점. 말미오름과 성산일출봉 사이를 지납니다.', 'jeju olle trail'],
  ['olle', '올레 7코스 (외돌개)', 126.546, 33.24, '외돌개와 서귀포 해안절벽을 따라 걷는 대표 코스.', 'oedolgae'],
  ['olle', '올레 10코스 (송악산~하모)', 126.255, 33.214, '송악산과 모슬포 해안을 잇는 서남부 코스.', 'jeju coastal path'],

  ['port', '제주항', 126.5365, 33.5195, '제주시의 관문. 육지와 여객선·화물선이 오갑니다.', 'jeju port'],
  ['port', '서귀포항', 126.564, 33.24, '새섬과 이어진 남쪽의 대표 항구.', 'seogwipo port'],
  ['port', '성산포항', 126.927, 33.473, '우도로 가는 도항선이 출발하는 항구.', 'seongsan port'],
  ['port', '한림항', 126.268, 33.414, '비양도와 추자도로 가는 서쪽 항구.', 'hallim port'],
  ['port', '화순항', 126.337, 33.23, '남서부의 항구. 해군기지와 가까운 화순해수욕장.', 'hwasun beach jeju'],

  ['tangerine', '서귀포 감귤 재배지', 126.6, 33.29, '따뜻한 남쪽 사면에 펼쳐진 감귤 과수원. 겨울이면 주황빛으로 물듭니다.', 'jeju tangerine farm'],
  ['tangerine', '남원 감귤 재배지', 126.72, 33.28, '한라봉과 천혜향 등 만감류 재배가 활발한 지역.', 'tangerine orchard'],

  ['wind', '행원 풍력발전단지', 126.795, 33.555, '북동쪽 해안에서 바닷바람으로 전기를 만드는 풍력단지.', 'wind turbine sea'],
  ['wind', '한경 풍력발전단지', 126.17, 33.337, '서쪽 해안의 풍력발전단지. 노을 명소이기도 합니다.', 'wind turbines coast'],
  ['wind', '가시리 풍력발전단지', 126.745, 33.368, '조랑말 목장과 어우러진 중산간 풍력단지.', 'wind turbine field'],

  ['lighthouse', '도두 쌍무지개 등대', 126.4655, 33.512, '무지개 해안도로에 자리한 알록달록한 등대.', 'jeju lighthouse'],
  ['lighthouse', '성산 등대', 126.942, 33.466, '성산일출봉 앞바다를 비추는 등대.', 'lighthouse sea sunrise'],
  ['lighthouse', '한림 비양도 등대', 126.24, 33.414, '서쪽 바다를 지키는 등대와 비양도.', 'biyangdo'],

  ['dolhareubang', '제주공항 돌하르방', 126.493, 33.511, '제주의 첫인상을 맞이하는 돌하르방.', 'dolhareubang'],
  ['dolhareubang', '성읍민속마을 돌하르방', 126.801, 33.387, '조선시대 현청 마을의 전통 돌하르방.', 'jeju stone grandfather'],
  ['dolhareubang', '서귀포 돌하르방', 126.56, 33.25, '현무암으로 빚은 제주의 수호신.', 'dolhareubang statue'],
]

// 오른쪽 위로 향한 핀이 지면에서 떠 있는 높이
export const LIFT = { wind: 2.6, lighthouse: 1.9, dolhareubang: 1.5 }

export const SPOTS = RAW.map(([layer, name, lon, lat, desc, q], i) => {
  const p = lonLat(lon, lat)
  const { x, z } = snapToLand(p.x, p.z)
  return { id: i, layer, name, desc, q, x, z, y: Math.max(heightAt(x, z), 0.15) }
})
