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

      coordinates.forEach(coord => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:12px;height:12px;border-radius:50%;
            background:#6C91C2;border:2.5px solid #fff;
            box-shadow:0 2px 8px rgba(108,145,194,.5),0 0 0 3px rgba(108,145,194,.15);
          "></div>`,
          iconSize:   [12, 12],
          iconAnchor: [6, 6],
        })

        const marker = L.marker([coord.lat, coord.lng], { icon }).addTo(map)
        marker.bindPopup(`
          <div style="font-family:-apple-system,system-ui,sans-serif;font-size:12px;min-width:180px">
            <div style="font-weight:600;margin-bottom:3px;color:#1e293b">${coord.domain || 'Location'}</div>
            <div style="color:#64748b;line-height:1.5">${coord.label}</div>
          </div>
        `, { className: 'inline-popup', maxWidth: 240 })
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
          background:#fff; border:1px solid #e2e8f0;
          border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,.12); padding:0;
        }
        .inline-popup .leaflet-popup-content { margin:10px 12px; }
        .inline-popup .leaflet-popup-tip     { background:#fff; }
        .leaflet-control-zoom {
          border:1px solid #e2e8f0 !important; border-radius:10px !important;
          overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08) !important;
        }
        .leaflet-control-zoom a {
          background:#fff !important; color:#64748b !important;
          border-bottom:1px solid #e2e8f0 !important; font-size:16px !important;
        }
        .leaflet-control-zoom a:hover { background:#f1f5f9 !important; color:#1e293b !important; }
        .leaflet-control-zoom-in  { border-radius:10px 10px 0 0 !important; }
        .leaflet-control-zoom-out { border-radius:0 0 10px 10px !important; border-bottom:none !important; }
        .leaflet-attribution-flag { display:none !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
    </>
  )
}
