// car/vehicles.js
window.BUS_VEHICLES = {
  low: {
    id: 'low',
    name: '에어로시티 (저상)',
    trans: 'auto',          // 'auto' 또는 'manual'
    wheelbase: 6.0,         // 축거 (m)
    maxSteer: 35,           // 최대 조향각 (도)
    latLimit: 3.0,          // 선회 시 허용 횡가속도 (m/s²)
    seats: 30,              // 좌석 수
    capacity: 60,           // 승객 정원
    gearLimit: [0, 18, 35, 52, 72, 88],
    gearRec: [null, [0, 12], [12, 28], [28, 45], [45, 65], [65, 85]],
    gearAcc: [0, 1.2, 1.0, 0.88, 0.78, 0.72],
    reverseLimit: 8,
    idle: 650,
    redline: 2600,
    brake: { service: 2.0, full: 4.2, airLag: 0.2, fullLag: 0.08 },
    retarder: { decel: [0, 0.6, 1.0, 1.4] } // 자동 변속용 리타더 (없으면 null)
  },
  high: {
    id: 'high',
    name: '에어로시티 (고상)',
    trans: 'manual',
    wheelbase: 6.0,
    maxSteer: 35,
    latLimit: 3.0,
    seats: 34,
    capacity: 65,
    gearLimit: [0, 18, 35, 52, 72, 88],
    gearRec: [null, [0, 12], [12, 28], [28, 45], [45, 65], [65, 85]],
    gearAcc: [0, 1.3, 1.1, 0.95, 0.85, 0.8],
    reverseLimit: 8,
    idle: 650,
    redline: 2600,
    brake: { service: 2.2, full: 4.5, airLag: 0.15, fullLag: 0.08 },
    retarder: null
  }
};
