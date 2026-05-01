const url = process.argv[2] || 'https://d4builds.gg/builds/3452e78f-f1ac-498e-8297-0e4c2dbf0e66/'

const res = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }
})

const hdrs = { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }

const bundleUrls = [
  'https://d4builds.gg/app-84a7376db760a3aa6c99.js',
  'https://d4builds.gg/33bb9847-5b3ee4cf15f2d1e1207e.js',
  'https://d4builds.gg/7112840a-cc1ff48a1f4153bfbd99.js',
]

let allJs = ''
for (const url of bundleUrls) {
  const r = await fetch(url, { headers: hdrs })
  allJs += await r.text()
}

// Firebase config: apiKey, projectId, authDomain
const apiKey = allJs.match(/apiKey:\s*["'\`]([A-Za-z0-9_\-]+)["'\`]/)
const projectId = allJs.match(/projectId:\s*["'\`]([a-z0-9\-]+)["'\`]/)
const authDomain = allJs.match(/authDomain:\s*["'\`]([^"'\`]+)["'\`]/)
const storageBucket = allJs.match(/storageBucket:\s*["'\`]([^"'\`]+)["'\`]/)

console.log('apiKey:', apiKey?.[1])
console.log('projectId:', projectId?.[1])
console.log('authDomain:', authDomain?.[1])
console.log('storageBucket:', storageBucket?.[1])

// Firestore REST path patterns
if (projectId?.[1]) {
  const pid = projectId[1]
  // Try reading a document - Firestore REST API
  const buildId = '3452e78f-f1ac-498e-8297-0e4c2dbf0e66'
  const collections = ['builds', 'build', 'userBuilds', 'planner']
  for (const col of collections) {
    const url = `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${col}/${buildId}`
    const r = await fetch(url, { headers: { ...hdrs, 'x-goog-api-key': apiKey?.[1] ?? '' } })
    const body = await r.text()
    console.log(`\n${col}/${buildId}: ${r.status} | ${body.slice(0,300)}`)
  }
}
