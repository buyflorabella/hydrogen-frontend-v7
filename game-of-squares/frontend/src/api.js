/**
 * API helper — all calls to the Flask backend.
 *
 * In development: Vite proxy forwards /api/* to the backend port.
 * In production:  Apache reverse proxy serves both on the same origin.
 *
 * Always use relative paths so same-origin routing works in both cases.
 */

async function api(path, opts = {}) {
  const resp = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  })
  return resp.json()
}

export async function ensureUser() {
  return api('/api/users/create', { method: 'POST' })
}

export async function fetchStatus() {
  return api('/api/game/status')
}

export async function submitPlay(selectedTileId) {
  return api('/api/game/play', {
    method: 'POST',
    body: JSON.stringify({ selected_tile_id: selectedTileId }),
  })
}

export async function fetchCoupon(code) {
  const query = code ? `?code=${encodeURIComponent(code)}` : ''
  return api(`/api/coupons/redeem${query}`)
}

export async function devAction(action) {
  return api(`/api/dev/${action}`, { method: 'POST' })
}

export async function devGetUserState() {
  return api('/api/dev/user-state')
}
