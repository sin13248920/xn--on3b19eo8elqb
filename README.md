# 지도 버스 운전게임

## 폴더 구조
```
index.html          게임 본체
car/                버스 정의 (JSON)
  index.json        초기화면에 보여 줄 버스 파일 목록
  aerocity-low.json
  aerocity-high.json
route/              노선 (구글어스 KML)
  index.json        초기화면에 보여 줄 노선 파일 목록
  2416.kml
```
GitHub Pages는 폴더 안의 파일 목록을 읽을 수 없어서, 새 파일을 넣으면 `index.json`에도 파일명을 한 줄 추가해야 해요.

## 버스 추가·수정 (car/*.json)
1. 기존 JSON을 복사해 새 이름으로 저장하고 값을 고칩니다.
2. `car/index.json`에 파일명을 추가합니다.

빠진 항목은 기본값으로 채워져요. 항목 설명:

| 항목 | 설명 |
|---|---|
| name | 초기화면에 표시되는 이름 |
| transmission | `auto`(자동) 또는 `manual`(수동, 클러치·E/Q 변속) |
| wheelbase / maxSteer / latLimit | 축거(m) / 최대 조향각(도) / 선회 시 허용 횡가속도(m/s²) |
| seats / capacity | 좌석 수 / 승객 정원 |
| gearLimit | 기어별 한계 속도(km/h), 첫 값 0은 중립 자리 |
| gearRec | 기어별 권장 속도 구간(km/h). 자동 변속 기준 |
| gearAcc | 기어별 최대 가속도(m/s²) |
| reverseLimit | 후진 한계 속도(km/h) |
| idle / redline | 엔진 공회전 / 한계 회전수(rpm) |
| brake.service / brake.full | 일반 브레이크 / 풀 브레이킹 감속(m/s²) |
| brake.airLag / brake.fullLag | 공압 지연(초) |
| retarder.decel | 리타더 단계별 감속(m/s²). 첫 값 0 = OFF. 없으면 `null` |
| doorTime | 문이 열리고 닫히는 시간(초) |

gearLimit, gearAcc, gearRec는 항목 수가 같아야 해요.

## 노선 추가 (route/*.kml)
- 구글어스에서 노선 선(경로)과 정류소(위치표시)를 찍어 KML로 저장해 `route/`에 넣고, `route/index.json`에 파일명을 추가합니다.
- 파일명은 `노선번호(방향).kml` 형식으로 지으세요. 예: `2222(강남방면).kml`, `2222(차고지방면).kml`
- 정류소의 **설명**에 `회차점`(또는 `회차지`)이라고 적으면 그 정류소가 회차점이 됩니다. 회차점에서 승객이 모두 내리고 문을 닫으면 같은 번호의 다른 방향 파일로 자동 전환돼요. (노선의 첫 번째 정류소는 회차점으로 취급하지 않아요.)
- 정류소 이름은 위치표시의 이름이에요. 이름을 안 붙이면 `정류소 N`으로 표시돼요.

## 조작
W/S 가속·브레이크, A/D 조향, Space 비상브레이크, F 앞문, G 뒷문, P 주차브레이크, R/T 리타더(있는 버스), Shift+E/Q 변속(수동 버스), Z/X 지도 확대·축소, / 정지화면
