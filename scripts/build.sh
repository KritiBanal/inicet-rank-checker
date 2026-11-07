#!/usr/bin/env bash
# Rebuild docs/index.html from src/ and data/alldata.js
set -euo pipefail
cd "$(dirname "$0")/.."
{
  echo '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>body{margin:0}</style>'
  grep -v 'claude:viewport-fit-sides' src/head.html
  echo '</head>
<body>'
  cat src/body.html
  echo '<script>'; cat data/alldata.js; echo; cat src/colleges.js; echo; cat src/app.js; echo '</script>
</body>
</html>'
} > docs/index.html
echo "Built docs/index.html"
{
  echo '<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>body{margin:0}</style>
<title>INI-CET January 2027 Cutoff Predictions</title>'
  grep -v -e 'claude:viewport-fit-sides' -e '<title>' src/head.html
  echo '</head>
<body>'
  cat src/predict.html
  echo '<script>'; cat data/predictions.js; echo; cat src/predict.js; echo '</script>
</body>
</html>'
} > docs/predictions.html
echo "Built docs/predictions.html"
