$urls = @(
  'http://localhost:3000/',
  'http://localhost:3000/index.html',
  'http://localhost:3000/styles/main.css',
  'http://localhost:3000/js/app.js',
  'http://localhost:3000/js/store.js',
  'http://localhost:3000/js/api.js',
  'http://localhost:3000/js/auth.js',
  'http://localhost:3000/js/analytics.js',
  'http://localhost:3000/js/data/demo/demo-seed.js',
  'http://localhost:3000/js/data/demo/demo-provider.js',
  'http://localhost:3000/js/data/demo/demo-baseline.js',
  'http://localhost:3000/js/data/demo/demo-events.js',
  'http://localhost:3000/js/data/demo/demo-experiments.js',
  'http://localhost:3000/js/data/live/live-provider.js',
  'http://localhost:3000/js/metrics/metric-definitions.js',
  'http://localhost:3000/js/metrics/metric-engine.js',
  'http://localhost:3000/js/metrics/baseline-engine.js',
  'http://localhost:3000/js/metrics/trend-engine.js',
  'http://localhost:3000/js/metrics/funnel-engine.js',
  'http://localhost:3000/js/metrics/insight-engine.js',
  'http://localhost:3000/js/metrics/experiment-engine.js',
  'http://localhost:3000/js/components/student-view.js',
  'http://localhost:3000/js/components/kitchen-view.js',
  'http://localhost:3000/js/components/admin-view.js',
  'http://localhost:3000/js/components/auth-view.js'
)

$allOk = $true
foreach ($u in $urls) {
  try {
    $res = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing -ErrorAction Stop
    Write-Host "$u -> $($res.StatusCode)"
  } catch {
    Write-Host "$u -> FAILED: $_" -ForegroundColor Red
    $allOk = $false
  }
}

if ($allOk) {
  Write-Host "`nAll 25 modules and assets returned HTTP 200 OK!" -ForegroundColor Green
} else {
  exit 1
}
