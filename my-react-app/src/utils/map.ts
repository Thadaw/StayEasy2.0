export function buildMapEmbedUrl(opts: {
  lat?: number | string | null
  lng?: number | string | null
  address?: string
}): string | null {
  const latNum = opts.lat !== undefined && opts.lat !== null && opts.lat !== "" ? Number(opts.lat) : NaN
  const lngNum = opts.lng !== undefined && opts.lng !== null && opts.lng !== "" ? Number(opts.lng) : NaN
  if (Number.isFinite(latNum) && Number.isFinite(lngNum) && (latNum !== 0 || lngNum !== 0)) {
    return `https://maps.google.com/maps?q=${latNum},${lngNum}&z=15&output=embed`
  }
  const query = (opts.address || "").trim()
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`
  }
  return null
}

export function buildMapDirectionsUrl(opts: {
  lat?: number | string | null
  lng?: number | string | null
  address?: string
}): string {
  const latNum = opts.lat !== undefined && opts.lat !== null && opts.lat !== "" ? Number(opts.lat) : NaN
  const lngNum = opts.lng !== undefined && opts.lng !== null && opts.lng !== "" ? Number(opts.lng) : NaN
  if (Number.isFinite(latNum) && Number.isFinite(lngNum) && (latNum !== 0 || lngNum !== 0)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}`
  }
  const query = (opts.address || "").trim()
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}
