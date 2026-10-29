import * as THREE from 'three'

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra })

export function makePin(color) {
  const g = new THREE.Group()
  const m = mat(color, { emissive: color, emissiveIntensity: 0.2 })
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 8), mat('#ffffff'))
  stem.position.y = 0.5
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), m)
  ball.position.y = 1.15
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide }))
  ring.position.y = 1.15
  ring.userData.billboard = true
  g.add(stem, ball, ring)
  return g
}

export function makeTurbine() {
  const g = new THREE.Group()
  const white = mat('#f4f6f8')
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 2, 10), white)
  tower.position.y = 1
  const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.3), white)
  nacelle.position.set(0, 2.02, 0.05)
  const rotor = new THREE.Group()
  rotor.position.set(0, 2.02, 0.22)
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group()
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.95, 0.015), white)
    blade.position.y = 0.5
    arm.add(blade)
    arm.rotation.z = (i * Math.PI * 2) / 3
    rotor.add(arm)
  }
  g.add(tower, nacelle, rotor)
  g.userData.rotor = rotor
  return g
}

export function makeLighthouse() {
  const g = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 1.5, 14), mat('#fafafa'))
  body.position.y = 0.75
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.28, 14), mat('#dc2626'))
  band.position.y = 0.85
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14), mat('#374151'))
  gallery.position.y = 1.52
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), mat('#fde047', { emissive: '#fde047', emissiveIntensity: 0.9 }))
  lamp.position.y = 1.68
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 14), mat('#dc2626'))
  roof.position.y = 1.9
  g.add(body, band, gallery, lamp, roof)
  return g
}

export function makeDolhareubang() {
  const g = new THREE.Group()
  const stone = mat('#4b4b4f', { roughness: 1 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.8, 14), stone)
  body.position.y = 0.4
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), stone)
  head.scale.set(1, 1.05, 0.95)
  head.position.y = 1.02
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.2, 14), stone)
  hat.position.y = 1.32
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), stone)
  nose.position.set(0, 1.0, 0.26)
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), mat('#111827'))
  const eyeR = eyeL.clone()
  eyeL.position.set(-0.1, 1.09, 0.24)
  eyeR.position.set(0.1, 1.09, 0.24)
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.12), stone)
  armL.position.set(-0.12, 0.6, 0.24)
  armL.rotation.z = 0.35
  const armR = armL.clone()
  armR.position.x = 0.12
  armR.rotation.z = -0.35
  g.add(body, head, hat, nose, eyeL, eyeR, armL, armR)
  g.scale.setScalar(1.1)
  return g
}
