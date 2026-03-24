import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { LootBox, UserLocation } from "../types";

// Inject Leaflet CSS into <head> on first load
const LEAFLET_CSS_ID = "leaflet-css";
if (typeof document !== "undefined" && !document.getElementById(LEAFLET_CSS_ID)) {
  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(link);

  // Custom map marker styles
  const style = document.createElement("style");
  style.textContent = `
    .lootbox-marker { transition: transform 0.2s ease; }
    .lootbox-marker:hover { transform: scale(1.2) !important; z-index: 1000 !important; }
    .user-marker { animation: lootdrop-pulse 2s ease-in-out infinite; }
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      box-shadow: 0 4px 20px rgba(255, 87, 34, 0.15) !important;
      font-family: 'Nunito', system-ui, sans-serif !important;
    }
    .leaflet-popup-content {
      margin: 10px 14px !important;
      font-size: 14px !important;
    }
    .leaflet-popup-content strong {
      font-weight: 800;
      color: #1A1A2E;
    }
    .leaflet-popup-content .loot-value {
      color: #FF5722;
      font-weight: 800;
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);
}

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = L.divIcon({
  className: "user-marker",
  html: `<div style="
    width: 22px; height: 22px; border-radius: 50%;
    background: #FF5722; border: 3px solid white;
    box-shadow: 0 0 12px rgba(255, 87, 34, 0.5), 0 2px 6px rgba(0,0,0,0.2);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍕",
  retail: "🛍",
  entertainment: "🎮",
  services: "⚡",
};

function lootBoxIcon(isActive: boolean, businessName: string, category?: string) {
  const emoji = CATEGORY_EMOJI[category || ""] || "📦";

  if (!isActive) {
    return L.divIcon({
      className: "lootbox-marker",
      html: `<div style="
        width: 36px; height: 36px; border-radius: 12px;
        background: #252940; border: 2px solid #64748B;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; opacity: 0.6;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">⏳</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  return L.divIcon({
    className: "lootbox-marker",
    html: `<div style="
      width: 40px; height: 40px; border-radius: 14px;
      background: linear-gradient(135deg, #FF6D3A, #FF5722);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
      box-shadow: 0 0 16px rgba(255, 109, 58, 0.4), 0 4px 8px rgba(0,0,0,0.2);
    ">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

/** Recenter map when user location changes */
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!hasCentered.current) {
      map.setView([lat, lng], 14);
      hasCentered.current = true;
    }
  }, [lat, lng, map]);

  return null;
}

interface LeafletMapViewProps {
  lootBoxes: LootBox[];
  userLocation: UserLocation | null;
  onLootBoxPress: (lootBox: LootBox) => void;
}

export function LeafletMapView({
  lootBoxes,
  userLocation,
  onLootBoxPress,
}: LeafletMapViewProps) {
  const center: [number, number] = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : lootBoxes.length > 0
    ? [lootBoxes[0].latitude, lootBoxes[0].longitude]
    : [37.7749, -122.4194];

  // Use dark map tiles for game feel
  const tileUrl =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
    >
      <TileLayer attribution={attribution} url={tileUrl} />

      {userLocation && (
        <>
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
          <RecenterMap lat={userLocation.latitude} lng={userLocation.longitude} />
        </>
      )}

      {lootBoxes.map((box) => (
        <Marker
          key={box.id}
          position={[box.latitude, box.longitude]}
          icon={lootBoxIcon(box.isActive, box.businessName, box.category)}
          eventHandlers={{
            click: () => onLootBoxPress(box),
          }}
        >
          <Popup>
            <strong>{box.businessName}</strong>
            <br />
            <span className="loot-value">
              {box.isActive ? box.coupon.value : "Recharging..."}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
