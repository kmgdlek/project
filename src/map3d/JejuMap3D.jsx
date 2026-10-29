import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildTerrain, buildSea, coastLoop, tangerineSpots, heightAt, SEA_LEVEL } from './terrain.js'
import { LAYERS, SPOTS, LIFT } from './data.js'
import { makePin, makeTurbine, makeLighthouse, makeDolhareubang } from './models.js'
import { fetchImages } from '../lib/pixabay.js'

const layerColor = Object.fromEntries(LAYERS.map((l) => [l.key, l.color]))
const sky = 0xcfe8f3

export default function JejuMap3D() {
  const mountRef = useRef(null)
  const tipRef = useRef(null)
  const api = useRef({})
  const [visible, setVisible] = useState(() => Object.fromEntries(LAYERS.map((l) => [l.key, true])))
  const [selected, setSelected] = useState(null)
  const [photo, setPhoto] = useState(null)

  // 장면 구성 (한 번만)
  useEffect(() => {
    const mount = mountRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(sky)
    scene.fog = new THREE.Fog(sky, 90, 230)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 600)
    camera.position.set(0, 46, 58)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.minDistance = 6
    controls.maxDistance = 130
    controls.maxPolarAngle = Math.PI * 0.47
    controls.target.set(0, 0, 0)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6b8e6b, 0.95))
    const sun = new THREE.DirectionalLight(0xffffff, 1.15)
    sun.position.set(30, 50, 20)
    scene.add(sun)

    scene.add(buildTerrain(), buildSea())

    // 레이어별 그룹
    const layers = {}
    for (const l of LAYERS) {
      layers[l.key] = new THREE.Group()
      scene.add(layers[l.key])
    }

    // 올레길: 해안선을 따라 도는 경로
    const loop = coastLoop()
    const olleTube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loop, true, 'catmullrom', 0.5), 700, 0.1, 6, true),
      new THREE.MeshStandardMaterial({ color: layerColor.olle, emissive: layerColor.olle, emissiveIntensity: 0.3 }),
    )
    layers.olle.add(olleTube)

    // 감귤 재배지: 인스턴스로 나무와 열매를 흩뿌림
    const trees = tangerineSpots()
    const foliage = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshStandardMaterial({ color: '#2f7d32' }), trees.length)
    const fruit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: '#fb8c00', emissive: '#f97316', emissiveIntensity: 0.25 }), trees.length * 2)
    const m4 = new THREE.Matrix4()
    trees.forEach((t, i) => {
      m4.setPosition(t.x, t.y + 0.25, t.z)
      foliage.setMatrixAt(i, m4)
      m4.setPosition(t.x + 0.16, t.y + 0.42, t.z + 0.12)
      fruit.setMatrixAt(i * 2, m4)
      m4.setPosition(t.x - 0.14, t.y + 0.34, t.z - 0.12)
      fruit.setMatrixAt(i * 2 + 1, m4)
    })
    layers.tangerine.add(foliage, fruit)

    // 풍력발전기, 등대, 돌하르방 모델 + 핀
    const rotors = []
    const pins = []
    for (const s of SPOTS) {
      if (s.layer === 'wind') {
        for (let i = -2; i <= 2; i++) {
          const t = makeTurbine()
          const tx = s.x + i * 1.1
          const tz = s.z - i * 0.26
          t.position.set(tx, Math.max(heightAt(tx, tz), 0.15), tz)
          layers.wind.add(t)
          rotors.push(t.userData.rotor)
        }
      } else if (s.layer === 'lighthouse') {
        const m = makeLighthouse()
        m.position.set(s.x, s.y, s.z)
        layers.lighthouse.add(m)
      } else if (s.layer === 'dolhareubang') {
        const m = makeDolhareubang()
        m.position.set(s.x, s.y, s.z)
        layers.dolhareubang.add(m)
      }
      const pin = makePin(layerColor[s.layer])
      pin.position.set(s.x, s.y + (LIFT[s.layer] ?? 0), s.z)
      pin.scale.setScalar(1.5)
      pin.userData.spot = s
      layers[s.layer].add(pin)
      pins.push(pin)
    }

    // 크기 조절
    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(mount)
    resize()

    // 호버/클릭 선택
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let down = null
    const pick = (e) => {
      const r = renderer.domElement.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const cands = pins.filter((p) => layers[p.userData.spot.layer].visible)
      const hit = ray.intersectObjects(cands, true)[0]
      if (!hit) return null
      let o = hit.object
      while (o && !o.userData.spot) o = o.parent
      return o?.userData.spot ?? null
    }
    const onMove = (e) => {
      const s = pick(e)
      const tip = tipRef.current
      renderer.domElement.style.cursor = s ? 'pointer' : 'grab'
      if (!tip) return
      if (s) {
        tip.textContent = s.name
        tip.style.opacity = 1
        tip.style.transform = `translate(${e.clientX - mount.getBoundingClientRect().left + 12}px, ${e.clientY - mount.getBoundingClientRect().top + 12}px)`
      } else tip.style.opacity = 0
    }
    const onDown = (e) => { down = { x: e.clientX, y: e.clientY } }
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      const s = pick(e)
      if (s) api.current.select(s)
    }
    const el = renderer.domElement
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)

    // 카메라 이동
    let fly = null
    const flyTo = (s) => {
      const target = new THREE.Vector3(s.x, s.y, s.z)
      fly = { target, pos: target.clone().add(new THREE.Vector3(0, 14, 20)) }
    }
    controls.addEventListener('start', () => { fly = null })

    api.current = {
      layers,
      flyTo,
      select: (s) => { setSelected(s); flyTo(s) },
      highlight: (id) => pins.forEach((p) => p.scale.setScalar(p.userData.spot.id === id ? 2.4 : 1.5)),
    }

    let raf
    const loop2 = () => {
      raf = requestAnimationFrame(loop2)
      if (fly) {
        controls.target.lerp(fly.target, 0.07)
        camera.position.lerp(fly.pos, 0.07)
        if (camera.position.distanceTo(fly.pos) < 0.2) fly = null
      }
      rotors.forEach((r) => { r.rotation.z += 0.04 })
      controls.update()
      renderer.render(scene, camera)
    }
    loop2()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      controls.dispose()
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        const m = o.material
        if (Array.isArray(m)) m.forEach((x) => x.dispose())
        else m?.dispose?.()
      })
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      api.current = {}
    }
  }, [])

  useEffect(() => {
    const { layers } = api.current
    if (layers) for (const [k, v] of Object.entries(visible)) layers[k].visible = v
  }, [visible])

  useEffect(() => {
    api.current.highlight?.(selected?.id ?? -1)
    setPhoto(null)
    if (!selected) return
    let alive = true
    fetchImages(selected.q, 3).then((h) => alive && setPhoto(h[0] ?? null)).catch(() => {})
    return () => { alive = false }
  }, [selected])

  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }))
  const shown = SPOTS.filter((s) => visible[s.layer])

  return (
    <div className="map-page">
      <div className="map-canvas" ref={mountRef} />
      <div className="map-tip" ref={tipRef} />

      <div className="map-panel">
        <h2>🏝️ 제주 3D 지도</h2>
        <div className="map-chips">
          {LAYERS.map((l) => (
            <button key={l.key} className={`mchip ${visible[l.key] ? 'on' : ''}`} style={{ '--c': l.color }} onClick={() => toggle(l.key)}>
              <i /> {l.label}
            </button>
          ))}
        </div>
        <details className="map-list" open>
          <summary>장소 목록 ({shown.length})</summary>
          <ul>
            {shown.map((s) => (
              <li key={s.id}>
                <button className={selected?.id === s.id ? 'on' : ''} onClick={() => api.current.select(s)}>
                  <i style={{ background: layerColor[s.layer] }} /> {s.name}
                </button>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {selected && (
        <div className="map-card">
          <button className="x" onClick={() => setSelected(null)} aria-label="닫기">✕</button>
          {photo && <img src={photo.webformatURL} alt={photo.tags} />}
          <span className="tag" style={{ background: layerColor[selected.layer] }}>
            {LAYERS.find((l) => l.key === selected.layer).label}
          </span>
          <h3>{selected.name}</h3>
          <p>{selected.desc}</p>
          {photo && <small>사진 © {photo.user} / Pixabay</small>}
        </div>
      )}

      <div className="map-hint">드래그: 회전 · 휠/핀치: 확대 · 우클릭 드래그: 이동 · 지형 높이는 약 5배 과장, 위치는 개략적입니다.</div>
    </div>
  )
}
