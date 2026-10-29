import * as THREE from 'three'
import { CA, SA, lonLat } from './geo.js'

export const SEA_LEVEL = 0.1
const COAST = 0.15
const HALLA = lonLat(126.533, 33.362)

function rng(seed) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

const noise = (x, z) =>
  Math.sin(x * 0.33 + 1.3) * Math.sin(z * 0.47 + 0.7) + 0.5 * Math.sin(x * 0.85 + z * 0.65 + 2) + 0.3 * Math.sin(x * 1.7 - z * 1.3)

// 지형 위에 솟는 봉우리(오름, 산방산, 성산일출봉)와 부속 섬(우도, 비양도)
const named = [
  [126.314, 33.239, 1.6, 0.9], // 산방산
  [126.942, 33.458, 1.2, 0.8], // 성산일출봉
  [126.951, 33.506, 1.4, 1.3], // 우도
  [126.228, 33.42, 1.0, 0.9], // 비양도
  [126.358, 33.364, 0.8, 1.0], // 새별오름
  [126.804, 33.482, 0.8, 0.9], // 다랑쉬오름
  [126.831, 33.446, 0.6, 0.9], // 용눈이오름
  [126.289, 33.205, 0.6, 0.8], // 송악산
  [126.71, 33.447, 0.5, 1.0], // 거문오름
].map(([lon, lat, amp, sig]) => ({ ...lonLat(lon, lat), amp, sig }))

const bumps = [...named]
{
  const rand = rng(7)
  let tries = 0
  while (bumps.length < named.length + 70 && tries++ < 2000) {
    const x = (rand() - 0.5) * 66
    const z = (rand() - 0.5) * 26
    const u = x * CA + z * SA
    const v = -x * SA + z * CA
    if (Math.hypot(u / 37, v / 15.5) > 0.82) continue
    if (Math.hypot(x - HALLA.x, z - HALLA.z) < 6.5) continue
    bumps.push({ x, z, amp: 0.25 + rand() * 0.45, sig: 0.7 + rand() * 0.6 })
  }
}

export function heightAt(x, z) {
  const u = x * CA + z * SA
  const v = -x * SA + z * CA
  const r = Math.hypot(u / 37, v / 15.5) * (1 + 0.045 * noise(x, z))
  let h = r < 1 ? COAST + 1.6 * Math.pow(1 - r, 0.9) : COAST - (r - 1) * 8
  const dx = x - HALLA.x
  const dz = z - HALLA.z
  const d2 = (dx * dx) / (2 * 5.4 * 5.4) + (dz * dz) / (2 * 4.4 * 4.4)
  h += 5 * Math.exp(-d2) + 0.9 * Math.exp(-d2 / 3)
  h -= 0.55 * Math.exp(-(dx * dx + dz * dz) / (2 * 0.5 * 0.5)) // 백록담
  for (const b of bumps) {
    const ex = x - b.x
    const ez = z - b.z
    h += b.amp * Math.exp(-(ex * ex + ez * ez) / (2 * b.sig * b.sig))
  }
  return h
}

// 바다에 떨어진 좌표를 해안선 안쪽으로 끌어당긴다
export function snapToLand(x, z, min = 0.22) {
  let px = x
  let pz = z
  for (let i = 0; i < 300 && heightAt(px, pz) < min; i++) {
    const len = Math.hypot(px, pz) || 1
    px -= (px / len) * 0.15
    pz -= (pz / len) * 0.15
  }
  return { x: px, z: pz }
}

const STOPS = [
  [-3, '#2b6fa8'], [-2, '#3a8fc0'], [-1, '#58b3d6'], [-0.3, '#8fd8e4'], [0.05, '#b8eeea'],
  [0.1, '#eadfb4'], [0.3, '#dccf9a'], [0.55, '#a9c76a'], [1.4, '#78a54c'], [2.6, '#4d8341'],
  [3.6, '#6d7b46'], [4.6, '#8e7c5e'], [5.6, '#a58a76'], [7.2, '#ece7de'],
].map(([h, c]) => [h, new THREE.Color(c)])

// 땅 위에 얹는 색: 현무암 해안, 밭 모자이크, 억새 들판
const BASALT = new THREE.Color('#3b3b42')
const FIELDS = ['#b9d36a', '#e6cf63', '#9ccc65', '#d9a066', '#f2d64b', '#7fb85a', '#c8dc7a'].map((c) => new THREE.Color(c))
const GRASS = new THREE.Color('#cdb862')
const smooth = (a, b, t) => { const k = Math.min(Math.max((t - a) / (b - a), 0), 1); return k * k * (3 - 2 * k) }
const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }

function landOverlay(h, x, z, c) {
  // 현무암 해안: 해안선 바로 안쪽에 불규칙하게 검은 돌 띠
  const rock = smooth(0.1, 0.16, h) * (1 - smooth(0.28, 0.5, h)) * Math.min(Math.max(noise(x * 1.1, z * 1.1) + 0.3, 0), 1)
  c.lerp(BASALT, rock * 0.85)
  // 밭: 저지대를 작은 구획으로 나눠 색을 달리한다
  const field = smooth(0.45, 0.8, h) * (1 - smooth(1.5, 2.1, h))
  if (field > 0) {
    const fc = FIELDS[Math.floor(hash(Math.floor(x / 1.5), Math.floor(z / 1.2)) * FIELDS.length)]
    c.lerp(fc, field * 0.75)
  }
  // 억새 들판: 중산간의 누런 초원 얼룩
  const grass = smooth(0.8, 1.3, h) * (1 - smooth(2.6, 3.2, h)) * smooth(0.1, 0.9, noise(x * 0.6 + 5, z * 0.6 - 3))
  c.lerp(GRASS, grass * 0.65)
  // 숲: 중턱은 짙은 초록과 연한 초록이 얼룩지게
  const forest = smooth(1.8, 2.6, h) * (1 - smooth(3.6, 4.4, h))
  c.offsetHSL(0, 0, (noise(x * 2.1, z * 2.1) * 0.025) * forest)
}

function colorAt(h, out) {
  if (h <= STOPS[0][0]) return out.copy(STOPS[0][1])
  for (let i = 1; i < STOPS.length; i++) {
    if (h <= STOPS[i][0]) {
      const t = (h - STOPS[i - 1][0]) / (STOPS[i][0] - STOPS[i - 1][0])
      return out.copy(STOPS[i - 1][1]).lerp(STOPS[i][1], t)
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1])
}

export function buildTerrain() {
  const g = new THREE.PlaneGeometry(96, 56, 260, 150)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  const lake = new THREE.Color('#3fa7c9')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const h = Math.max(heightAt(x, z), -3)
    pos.setY(i, h < SEA_LEVEL ? SEA_LEVEL + (h - SEA_LEVEL) * 0.12 : h) // 수면 아래는 완만한 대륙붕
    colorAt(h, c)
    if (h >= SEA_LEVEL) landOverlay(h, x, z, c)
    if (Math.hypot(x - HALLA.x, z - HALLA.z) < 0.5) c.copy(lake)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }))
}

// 바다: 지형 바깥을 끝없이 이어지는 평면으로 덮어 가장자리가 보이지 않게 한다.
// 지형 가장자리의 수심 색(#2b6fa8)과 같은 색·같은 재질이라 이음새가 드러나지 않는다.
export function buildOcean() {
  const edgeY = SEA_LEVEL + (-3 - SEA_LEVEL) * 0.12
  const shape = new THREE.Shape()
  shape.moveTo(-900, -900); shape.lineTo(900, -900); shape.lineTo(900, 900); shape.lineTo(-900, 900); shape.lineTo(-900, -900)
  const hole = new THREE.Path()
  hole.moveTo(-48, -28); hole.lineTo(-48, 28); hole.lineTo(48, 28); hole.lineTo(48, -28); hole.lineTo(-48, -28)
  shape.holes.push(hole)
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: '#2b6fa8', roughness: 0.95, metalness: 0 }))
  m.rotation.x = -Math.PI / 2
  m.position.y = edgeY
  return m
}

// 해안선을 따라 도는 올레길(개념 경로)
export function coastLoop(level = 0.5, n = 360) {
  const pts = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    for (let k = 1.4; k > 0.2; k -= 0.005) {
      const u = 37 * k * Math.cos(t)
      const v = 15.5 * k * Math.sin(t)
      const x = u * CA - v * SA
      const z = u * SA + v * CA
      const h = heightAt(x, z)
      if (h > level) { pts.push(new THREE.Vector3(x, h + 0.12, z)); break }
    }
  }
  return pts
}

// 감귤 재배지: 서귀포 쪽 저지대에 흩뿌린다
export function tangerineSpots(count = 260) {
  const rand = rng(21)
  const out = []
  for (let t = 0; t < 6000 && out.length < count; t++) {
    const x = -30 + rand() * 62
    const z = 2 + rand() * 14
    const h = heightAt(x, z)
    if (h < 0.5 || h > 2.2) continue
    if (Math.hypot(x - HALLA.x, z - HALLA.z) < 8) continue
    out.push({ x, y: h, z })
  }
  return out
}

export { rng }
