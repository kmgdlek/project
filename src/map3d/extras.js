import * as THREE from 'three'
import { CA, SA, lonLat } from './geo.js'
import { heightAt, coastLoop, rng } from './terrain.js'

const xy = (lon, lat) => new THREE.Vector2((lon - 126.55) * 93, (lat - 33.383) * 111)

// ---------- 글자 스프라이트 ----------
export function makeLabel(text, { color = '#ffffff', stroke = 'rgba(15,40,55,.85)', w = 6, fog = true } = {}) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')
  g.font = '700 64px -apple-system, "Pretendard", "Noto Sans KR", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineWidth = 12
  g.lineJoin = 'round'
  g.strokeStyle = stroke
  g.strokeText(text, 256, 64)
  g.fillStyle = color
  g.fillText(text, 256, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog }))
  sp.scale.set(w, w / 4, 1)
  sp.userData.base = w
  return sp
}

// 섬 위의 지명
export function buildRegionLabels() {
  const defs = [
    ['한라산', 126.533, 33.362, 1.9], ['제주시', 126.53, 33.5, 1.2], ['서귀포시', 126.56, 33.255, 1.2],
    ['성산', 126.9, 33.44, 1.2], ['우도', 126.951, 33.506, 1.8], ['한림', 126.27, 33.41, 1.2], ['대정', 126.25, 33.22, 1.2],
  ]
  return defs.map(([name, lon, lat, lift]) => {
    const p = lonLat(lon, lat)
    const s = makeLabel(name, { w: 6 })
    s.position.set(p.x, Math.max(heightAt(p.x, p.z), 0.15) + lift, p.z)
    return s
  })
}

// ---------- 주변 국가 (흐릿한 실루엣) ----------
function landmass(coords, color = '#b9c7bd') {
  const g = new THREE.Group()
  const pts = coords.map(([lo, la]) => xy(lo, la))
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(new THREE.Shape(pts)),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, fog: false, depthWrite: false, side: THREE.DoubleSide }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.05
  const line = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(p.x, 0.07, -p.y))),
    new THREE.LineBasicMaterial({ color: '#8aa095', transparent: true, opacity: 0.6, fog: false }),
  )
  g.add(mesh, line)
  return g
}

export function buildWorld() {
  const g = new THREE.Group()
  g.add(
    // 한반도 남부
    landmass([[126.12, 34.55], [126.45, 34.28], [126.8, 34.42], [127.3, 34.5], [127.7, 34.65], [128.1, 34.9], [128.7, 34.82], [129.1, 35.05], [129.4, 35.6], [129.45, 36.2], [129.4, 37.0], [129.2, 38.0], [126.0, 38.0], [126.5, 37.0], [126.2, 36.2], [126.5, 35.6], [126.4, 35.1]]),
    // 규슈
    landmass([[129.6, 33.6], [130.9, 33.95], [131.8, 33.6], [131.6, 32.4], [131.4, 31.4], [130.7, 31.0], [130.2, 31.3], [130.2, 32.6], [129.8, 33.0]]),
    // 쓰시마
    landmass([[129.2, 34.65], [129.5, 34.7], [129.45, 34.1], [129.2, 34.2]]),
    // 중국 동부 해안
    landmass([[123.0, 29.5], [122.2, 30.6], [121.9, 31.5], [120.9, 32.2], [120.4, 34.0], [119.2, 35.0], [120.5, 36.1], [121.0, 37.0], [122.5, 37.4], [122.7, 37.0], [112, 38], [112, 29.5]]),
  )
  const style = { color: '#64748b', stroke: 'rgba(255,255,255,.85)', w: 60, fog: false }
  for (const [name, lon, lat] of [['대한민국', 127.3, 35.6], ['일본', 130.8, 32.8], ['중국', 119.5, 33.2]]) {
    const s = makeLabel(name, style)
    const p = xy(lon, lat)
    s.position.set(p.x, 3, -p.y)
    g.add(s)
  }
  return g
}

// ---------- 장식 ----------
export function buildFoam() {
  const pts = coastLoop(0.115, 720)
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5), 1400, 0.055, 5, true),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7 }),
  )
  m.position.y = -0.08
  return m
}

export function buildForest() {
  const rand = rng(33)
  const halla = lonLat(126.533, 33.362)
  const pts = []
  for (let t = 0; t < 12000 && pts.length < 700; t++) {
    const x = -34 + rand() * 68
    const z = -14 + rand() * 28
    const h = heightAt(x, z)
    if (h < 1.7 || h > 4.3 || Math.hypot(x - halla.x, z - halla.z) < 1.3) continue
    pts.push({ x, z, h, s: 0.8 + rand() * 0.6, c: rand() })
  }
  const mesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.16, 0.5, 6), new THREE.MeshStandardMaterial({ flatShading: true }), pts.length)
  const m4 = new THREE.Matrix4()
  const col = new THREE.Color()
  const greens = ['#2e6b3c', '#3b7d3f', '#4f8a3a']
  pts.forEach((p, i) => {
    m4.makeScale(p.s, p.s, p.s).setPosition(p.x, p.h + 0.2 * p.s, p.z)
    mesh.setMatrixAt(i, m4)
    mesh.setColorAt(i, col.set(greens[Math.floor(p.c * 3)]))
  })
  return mesh
}

export function buildClouds() {
  const group = new THREE.Group()
  const rand = rng(5)
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, transparent: true, opacity: 0.85, emissive: '#ffffff', emissiveIntensity: 0.5 })
  const clouds = []
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group()
    const n = 4 + Math.floor(rand() * 3)
    for (let k = 0; k < n; k++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9 + rand() * 0.9, 1), mat)
      s.position.set((k - n / 2) * 1.3, rand() * 0.5, (rand() - 0.5) * 1.2)
      s.scale.y = 0.6
      c.add(s)
    }
    c.scale.setScalar(0.7 + rand() * 0.5)
    c.userData = { a: rand() * Math.PI * 2, rx: 52 + rand() * 14, rz: 29 + rand() * 9, y: 11 + rand() * 4, speed: 0.01 + rand() * 0.008 }
    clouds.push(c)
    group.add(c)
  }
  const update = (t) => clouds.forEach((c) => {
    const d = c.userData
    const a = d.a + t * d.speed
    c.position.set(d.rx * Math.cos(a), d.y, d.rz * Math.sin(a))
  })
  update(0)
  return { group, update }
}

function makeBoat() {
  const g = new THREE.Group()
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 1.0), new THREE.MeshStandardMaterial({ color: '#f8fafc' }))
  hull.position.y = 0.08
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 1.02), new THREE.MeshStandardMaterial({ color: '#2563eb' }))
  stripe.position.y = 0.12
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), new THREE.MeshStandardMaterial({ color: '#475569' }))
  mast.position.y = 0.6
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 3), new THREE.MeshStandardMaterial({ color: '#fff7ed' }))
  sail.scale.z = 0.1
  sail.position.set(0, 0.6, 0)
  g.add(hull, stripe, mast, sail)
  g.scale.setScalar(1.5)
  return g
}

export function buildBoats() {
  const group = new THREE.Group()
  const boats = []
  for (let i = 0; i < 6; i++) {
    const b = makeBoat()
    b.userData = { a: (i / 6) * Math.PI * 2, k: 1.14 + (i % 3) * 0.06, dir: i % 2 ? 1 : -1, speed: 0.012 + (i % 3) * 0.003 }
    boats.push(b)
    group.add(b)
  }
  const update = (t) => boats.forEach((b) => {
    const d = b.userData
    const a = d.a + t * d.speed * d.dir
    const u = 37 * d.k * Math.cos(a)
    const v = 15.5 * d.k * Math.sin(a)
    b.position.set(u * CA - v * SA, 0.0, u * SA + v * CA)
    const du = -37 * d.k * Math.sin(a) * d.dir
    const dv = 15.5 * d.k * Math.cos(a) * d.dir
    b.rotation.y = Math.atan2(du * CA - dv * SA, du * SA + dv * CA)
  })
  update(0)
  return { group, update }
}
