'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { MapCoordinate } from '@/lib/types'
import { getDomainColor } from '@/lib/map-theme'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

interface LeafletMapProps {
  coordinates: MapCoordinate[]
  tileUrl: string
  tileAttribution: string
  selectedId: string | null
  hoveredDomain: string | null
  onSelectId: (id: string | null) => void
  mapClickEnabled?: boolean
  onMapClick?: (lat: number, lng: number) => void
  /** Fly the map when this object changes (reference equality). */
  flyTo?: { lat: number; lng: number; zoom?: number } | null
}

function markerHtml(color: string, size: number, isSelected: boolean): string {
  const pulseRing = isSelected
    ? `<div style="
        position:absolute;top:-4px;left:-4px;
        width:${size + 8}px;height:${size + 8}px;
        border-radius:50%;border:2px solid ${color};
        opacity:0.35;animation:map-pulse 2s ease-out infinite;
      "></div>`
    : ''
  return `<div style="position:relative;width:${size}px;height:${size}px;">
    ${pulseRing}
    <div style="
      position:absolute;top:0;left:0;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      border:${isSelected ? 3 : 2}px solid #fff;
      cursor:pointer;
    "></div>
  </div>`
}

export default function LeafletMap({
  coordinates,
  tileUrl,
  tileAttribution,
  selectedId,
  hoveredDomain,
  onSelectId,
  mapClickEnabled = false,
  onMapClick,
  flyTo,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tileLayerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linesRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null)
  const onMapClickRef = useRef(onMapClick)
  onMapClickRef.current = onMapClick
  const hasInitialFitRef = useRef(false)
  const tileUrlInitRef = useRef(tileUrl)
  tileUrlInitRef.current = tileUrl

  const drawConnectionLines = useCallback(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    linesRef.current.forEach(l => map.removeLayer(l))
    linesRef.current = []

    const domainGroups = new Map<string, MapCoordinate[]>()
    for (const c of coordinates) {
      if (!domainGroups.has(c.domain)) domainGroups.set(c.domain, [])
      domainGroups.get(c.domain)!.push(c)
    }

    domainGroups.forEach((items, domain) => {
      if (items.length < 2) return
      const color = getDomainColor(domain)
      const isHovered = hoveredDomain === domain

      for (let i = 0; i < items.length - 1; i++) {
        const a = items[i]
        const b = items[i + 1]
        const line = L.polyline(
          [
            [a.lat, a.lng],
            [b.lat, b.lng],
          ],
          {
            color,
            weight: isHovered ? 3 : 1.5,
            opacity: isHovered ? 0.65 : 0.35,
            dashArray: isHovered ? undefined : '6 4',
            className: 'map-connection-line',
          },
        ).addTo(map)
        linesRef.current.push(line)
      }
    })
  }, [coordinates, hoveredDomain])

  const rebuildMarkers = useCallback(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current.clear()

    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    coordinates.forEach(coord => {
      const color = getDomainColor(coord.domain)
      const isSelected = selectedId === coord.id
      const size = isSelected ? 20 : 14

      const icon = L.divIcon({
        className: '',
        html: markerHtml(color, size, isSelected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })

      const marker = L.marker([coord.lat, coord.lng], { icon }).addTo(map)
      markersRef.current.set(coord.id, marker)

      marker.bindPopup(
        `<div style="font-family:-apple-system,system-ui,'Inter',sans-serif;font-size:12px;min-width:220px;max-width:280px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="
              width:28px;height:28px;border-radius:9999px;
              background:${color};
              display:flex;align-items:center;justify-content:center;
              color:#fff;font-weight:700;font-size:11px;flex-shrink:0;
            ">${esc(coord.domain.charAt(0).toUpperCase())}</div>
            <div>
              <div style="font-weight:700;color:#1C1E26;font-size:13px">${esc(coord.domain)}</div>
              <div style="font-size:10px;color:#78716c;margin-top:1px">${esc(coord.locationLabel)}</div>
            </div>
          </div>
          <div style="background:#FDFBF7;border:1px solid #d6d3d1;border-radius:10px;padding:10px 12px;margin-bottom:8px;">
            <div style="color:#1C1E26;line-height:1.55;font-size:11.5px">${esc(coord.notePreview)}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="
              display:inline-flex;align-items:center;gap:4px;
              font-size:10px;font-weight:600;color:${color};
              text-transform:uppercase;letter-spacing:0.5px;
            ">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${color}"></span>
              ${esc(coord.type.replace('-', ' '))}
            </span>
            <span style="font-size:10px;color:#a8a29e;font-family:monospace">${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}</span>
          </div>
        </div>`,
        { className: 'inline-popup', maxWidth: 300 },
      )

      marker.on('click', () => onSelectId(coord.id))
    })

    drawConnectionLines()
  }, [coordinates, selectedId, drawConnectionLines, onSelectId])

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    import('leaflet').then(L => {
      if (cancelled || !containerRef.current) return
      LRef.current = L

      const map = L.map(containerRef.current, {
        center: [37.8, -96],
        zoom: 4,
        minZoom: 3,
        maxBoundsViscosity: 0.8,
        zoomControl: false,
        attributionControl: true,
      })
      mapRef.current = map

      tileLayerRef.current = L.tileLayer(tileUrlInitRef.current, {
        attribution: tileAttribution,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)
      setMapReady(true)
    })

    return () => {
      cancelled = true
      setMapReady(false)
      hasInitialFitRef.current = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markersRef.current.clear()
        linesRef.current = []
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map mounts once; tile URL updated separately
  }, [])

  useEffect(() => {
    if (!mapReady || !tileLayerRef.current) return
    tileLayerRef.current.setUrl(tileUrl)
  }, [mapReady, tileUrl])

  useEffect(() => {
    if (!mapReady) return
    rebuildMarkers()
  }, [mapReady, rebuildMarkers])

  useEffect(() => {
    if (!mapReady || coordinates.length === 0 || hasInitialFitRef.current) return
    const map = mapRef.current
    const L = LRef.current
    if (!map || !L) return
    try {
      if (coordinates.length === 1) {
        map.setView([coordinates[0].lat, coordinates[0].lng], 6)
      } else {
        const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]))
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 })
        } else {
          map.setView([coordinates[0].lat, coordinates[0].lng], 6)
        }
      }
    } catch {
      map.setView([37.8, -96], 4)
    }
    hasInitialFitRef.current = true
  }, [mapReady, coordinates])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return

    const handler = (e: { latlng: { lat: number; lng: number } }) => {
      if (mapClickEnabled) onMapClickRef.current?.(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [mapReady, mapClickEnabled])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !flyTo) return
    map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom ?? Math.max(map.getZoom(), 6), { duration: 0.6 })
  }, [mapReady, flyTo])

  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map) return

    coordinates.forEach(coord => {
      const marker = markersRef.current.get(coord.id)
      if (!marker) return
      const color = getDomainColor(coord.domain)
      const isSelected = selectedId === coord.id
      const size = isSelected ? 20 : 14

      const icon = L.divIcon({
        className: '',
        html: markerHtml(color, size, isSelected),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
      marker.setIcon(icon)
    })

    if (selectedId) {
      const coord = coordinates.find(c => c.id === selectedId)
      if (coord) {
        map.flyTo([coord.lat, coord.lng], Math.max(map.getZoom(), 6), {
          duration: 0.8,
        })
      }
    }
  }, [selectedId, coordinates])

  useEffect(() => {
    drawConnectionLines()
  }, [drawConnectionLines])

  return (
    <>
      <style>{`
        @keyframes map-pulse {
          0% { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .map-connection-line { pointer-events: none; }
        .inline-popup .leaflet-popup-content-wrapper {
          background: #fff;
          border: 1px solid #d6d3d1;
          border-radius: 14px;
          padding: 0;
        }
        .inline-popup .leaflet-popup-content { margin: 12px 14px; }
        .inline-popup .leaflet-popup-tip { background: #fff; border: 1px solid #d6d3d1; }
        .leaflet-control-zoom {
          border: 1px solid #d6d3d1 !important;
          border-radius: 12px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: #FDFBF7 !important;
          color: #57534e !important;
          border-bottom: 1px solid #d6d3d1 !important;
          font-size: 16px !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
        }
        .leaflet-control-zoom a:hover {
          background: #F5EDE3 !important;
          color: #1C1E26 !important;
        }
        .leaflet-control-zoom-in { border-radius: 12px 12px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius: 0 0 12px 12px !important; border-bottom: none !important; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(253, 251, 247, 0.92) !important;
          color: #a8a29e !important;
          font-size: 9px !important;
        }
        .leaflet-container {
          background: #FDFBF7;
          font-family: -apple-system, system-ui, 'Inter', sans-serif;
        }
        .leaflet-container.map-cursor-crosshair {
          cursor: crosshair !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className={cn('h-full w-full', mapClickEnabled && 'map-cursor-crosshair')}
      />
    </>
  )
}
