// 제주 좌표계: 1 unit ≈ 1 km. 섬의 장축은 동쪽이 약간 위(북)로 기울어져 있다.
export const ANGLE = -0.236
export const CA = Math.cos(ANGLE)
export const SA = Math.sin(ANGLE)
export const lonLat = (lon, lat) => ({ x: (lon - 126.55) * 93, z: -(lat - 33.383) * 111 })
