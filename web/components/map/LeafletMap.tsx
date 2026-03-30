'use client'

import { useEffect, useRef } from 'react'
import type { MapCoordinate } from '@/lib/types'
import 'leaflet/dist/leaflet.css'

interface LeafletMapProps {
  coordinates: MapCoordinate[]
}

export default function LeafletMap({ coordinates }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Keep a typed reference without importing Leaflet at the module level
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Abort flag — prevents async import from creating a map after unmount
    let cancelled = false

    // Tear down any existing instance first (handles React Strict Mode double-fire)
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    import('leaflet').then(L => {
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, {
        center: [37.8, -96],
        zoom: 4,
        zoomControl: false,
      })
      mapRef.current = map

      // CartoDB Positron — light theme, no API key
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const typeColors: Record<string, string> = {
        'text': '#6C91C2',
        'canvas': '#a855f7',
        'ai-summary': '#10b981',
      }

      coordinates.forEach(coord => {
        const pinColor = typeColors[coord.type] ?? '#6C91C2'
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:14px;height:14px;border-radius:50%;
            background:${pinColor};border:2.5px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,.18);
            cursor:pointer;
          "></div>`,
          iconSize:   [14, 14],
          iconAnchor: [7, 7],
        })

        const esc = (s: string) => s
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
        const noteBody = esc(coord.notePreview || '')
        const placeLine = esc((coord.locationLabel || '').trim() || 'Location')
        const marker = L.marker([coord.lat, coord.lng], { icon }).addTo(map)
        marker.bindPopup(`
          <div style="font-family:-apple-system,system-ui,sans-serif;font-size:12px;min-width:200px;max-width:260px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${pinColor};flex-shrink:0"></span>
              <span style="font-weight:700;color:#37352F;font-size:13px">${esc(coord.domain || 'Location')}</span>
            </div>
            <div style="background:#F7F6F3;border:1px solid #E3E2DE;border-radius:8px;padding:8px 10px;margin-bottom:6px;">
              <div style="color:#37352F;line-height:1.5;font-size:11.5px">${noteBody}</div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:10px;font-weight:600;color:${pinColor};text-transform:uppercase;letter-spacing:0.5px">${placeLine}</span>
              <span style="font-size:10px;color:#9B9A97">${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}</span>
            </div>
          </div>
        `, { className: 'inline-popup', maxWidth: 280 })
      })

      if (coordinates.length > 0) {
        try {
          const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]))
          map.fitBounds(bounds, { padding: [60, 60] })
        } catch {
          map.setView([37.8, -96], 4)
        }
      }
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  // Re-initialize only when coordinates change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(coordinates)])

  return (
    <>
      <style>{`
        .inline-popup .leaflet-popup-content-wrapper {
          background:#fff; border:1px solid #E3E2DE;
          border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,.12); padding:0;
        }
        .inline-popup .leaflet-popup-content { margin:10px 12px; }
        .inline-popup .leaflet-popup-tip     { background:#fff; }
        .leaflet-control-zoom {
          border:1px solid #E3E2DE !important; border-radius:10px !important;
          overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08) !important;
        }
        .leaflet-control-zoom a {
          background:#fff !important; color:#64748b !important;
          border-bottom:1px solid #E3E2DE !important; font-size:16px !important;
        }
        .leaflet-control-zoom a:hover { background:#F1F1EF !important; color:#37352F !important; }
        .leaflet-control-zoom-in  { border-radius:10px 10px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius:0 0 10px 10px !important; border-bottom:none !important; }
        .leaflet-attribution-flag { display:none !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  )
}
