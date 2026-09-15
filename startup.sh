#!/bin/sh
# Portable validation startup: static serve in foreground on $PORT (default 3000).
# POSIX sh only — no bash dependency (envs without bash exec ./startup.sh with 127 otherwise).
set -eu

# --- resolve project root (script directory) ---
cd -- "$(dirname -- "$0")"

PORT="${PORT:-3000}"
BIND="${BIND:-127.0.0.1}"

_now() { date +%s; }
step() {
  _label="$1"; shift
  _s="$(_now)"
  echo ">>> [startup] ${_label}"
  "$@"
  _rc=$?
  _e="$(_now)"
  echo "<<< [startup] ${_label} OK in $((_e - _s))s"
  return "$_rc"
}
fail() { echo "!!! [startup] $*" >&2; exit 1; }

step "workdir: $(pwd)" true

# --- env check (POSIX, no bash -c) ---
if command -v python3 >/dev/null 2>&1; then _rt="python3";
elif command -v python >/dev/null 2>&1; then _rt="python";
elif command -v busybox >/dev/null 2>&1; then _rt="busybox";
elif command -v php >/dev/null 2>&1; then _rt="php";
elif command -v ruby >/dev/null 2>&1; then _rt="ruby";
elif command -v node >/dev/null 2>&1; then _rt="node";
elif command -v npx >/dev/null 2>&1; then _rt="npx";
else fail "no static server runtime found (need python3/python/busybox/php/ruby/node/npx)";
fi
step "env check: runtime=${_rt}" true

# --- install required dependencies (none for static build; honor manifests if added later) ---
if [ -f package.json ]; then
  command -v npm >/dev/null 2>&1 || fail "package.json present but npm not found"
  step "npm install" npm install
else
  step "install: static site, nothing to install" true
fi

# --- build when needed ---
if [ -f package.json ] && grep -q '"build"' package.json 2>/dev/null; then
  step "npm run build" npm run build
else
  step "build: static site, nothing to build" true
fi

[ -f index.html ] || fail "index.html not found in $(pwd)"

echo ">>> [startup] serving '$(pwd)' on http://${BIND}:${PORT} via ${_rt} (foreground, Ctrl-C to stop)"

# --- serve in the foreground ---
case "$_rt" in
  python3) exec python3 -m http.server "$PORT" --bind "$BIND" ;;
  python)  exec python -m http.server "$PORT" ;;
  busybox) exec busybox httpd -f -p "${BIND}:${PORT}" -h . ;;
  php)     exec php -S "${BIND}:${PORT}" ;;
  ruby)    exec ruby -run -e httpd -- -p "$PORT" ;;
  node)    exec node -e 'const http=require("http"),fs=require("fs"),path=require("path");const root=process.cwd();const port=+(process.env.PORT||3000);const types={".html":"text/html",".js":"text/javascript",".css":"text/css",".png":"image/png",".svg":"image/svg+xml",".json":"application/json",".ico":"image/x-icon"};http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split("?")[0]);if(p==="/")p="/index.html";const f=path.join(root,path.normalize(p).replace(/^(\.\.[\/\\])+/, ""));fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end("not found");return;}res.writeHead(200,{"Content-Type":types[path.extname(f)]||"application/octet-stream"});res.end(d);});}).listen(port,"127.0.0.1",()=>console.log("serving on 127.0.0.1:"+port));' ;;
  npx)     exec npx -y serve -l "$PORT" . ;;
esac
