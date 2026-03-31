import React, { useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
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

  // MarkerCluster CSS
  const clusterCss = document.createElement("link");
  clusterCss.rel = "stylesheet";
  clusterCss.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
  document.head.appendChild(clusterCss);

  const clusterDefaultCss = document.createElement("link");
  clusterDefaultCss.rel = "stylesheet";
  clusterDefaultCss.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
  document.head.appendChild(clusterDefaultCss);

  // MarkerCluster JS
  const clusterScript = document.createElement("script");
  clusterScript.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
  document.head.appendChild(clusterScript);

  const style = document.createElement("style");
  style.textContent = `
    .lootbox-marker { transition: transform 0.2s ease; cursor: pointer; }
    .lootbox-marker:hover { transform: scale(1.15) !important; z-index: 1000 !important; }
    .user-marker { animation: lootdrop-pulse 2s ease-in-out infinite; }
    .marker-cluster {
      background: rgba(255, 87, 34, 0.3);
      border-radius: 50%;
    }
    .marker-cluster div {
      background: #FF5722;
      color: white;
      border-radius: 50%;
      font-weight: 800;
      font-size: 14px;
      font-family: 'Nunito', sans-serif;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px !important;
      background: #1A1A2E !important;
      box-shadow: 0 4px 24px rgba(255, 87, 34, 0.2), 0 0 40px rgba(255, 87, 34, 0.05) !important;
      font-family: 'Nunito', system-ui, sans-serif !important;
    }
    .leaflet-popup-tip { background: #1A1A2E !important; }
    .leaflet-popup-content {
      margin: 12px 16px !important;
      font-size: 13px !important;
      color: #B0B0C0 !important;
      line-height: 1.5 !important;
    }
    .leaflet-popup-content .popup-name {
      font-weight: 800;
      color: #FFFFFF;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .leaflet-popup-content .popup-value {
      color: #FF5722;
      font-weight: 800;
      font-size: 18px;
    }
    .leaflet-popup-content .popup-scheduled {
      color: #64748B;
      font-size: 12px;
      font-weight: 600;
    }
    .leaflet-popup-content .popup-category {
      display: inline-block;
      background: rgba(255,87,34,0.12);
      color: #FF8A65;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 4px;
    }
    .leaflet-popup-close-button { color: #64748B !important; }
    .leaflet-popup-close-button:hover { color: #FF5722 !important; }
    .recenter-btn {
      position: absolute; bottom: 24px; right: 16px; z-index: 1000;
      width: 44px; height: 44px; border-radius: 50%;
      background: #1A1A2E; border: 2px solid rgba(255,87,34,0.3);
      color: #FF5722; font-size: 20px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
    }
    .recenter-btn:hover {
      background: #FF5722; color: white;
      box-shadow: 0 0 20px rgba(255,87,34,0.4);
    }
    .leaflet-control-zoom a {
      background: #1A1A2E !important;
      color: #B0B0C0 !important;
      border-color: rgba(255,87,34,0.2) !important;
    }
    .leaflet-control-zoom a:hover {
      background: #252940 !important;
      color: #FF5722 !important;
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
    width: 24px; height: 24px; border-radius: 50%;
    background: #FF5722; border: 3px solid white;
    box-shadow: 0 0 16px rgba(255, 87, 34, 0.6), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍕",
  retail: "🛍",
  entertainment: "🎮",
  services: "⚡",
};

const CATEGORY_LABEL: Record<string, string> = {
  restaurant: "Restaurant",
  retail: "Retail",
  entertainment: "Entertainment",
  services: "Services",
};

function lootBoxIcon(isActive: boolean, category?: string) {
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
      width: 42px; height: 42px; border-radius: 14px;
      background: linear-gradient(135deg, #FF6D3A, #FF5722);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      box-shadow: 0 0 20px rgba(255, 109, 58, 0.45), 0 4px 10px rgba(0,0,0,0.25);
      border: 2px solid rgba(255,255,255,0.15);
    ">${emoji}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function formatDropTime(dropTime: number): string {
  const now = Date.now();
  const diff = dropTime - now;
  if (diff <= 0) return "Available now";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `Drops in ${Math.floor(hours / 24)}d`;
  if (hours > 0) return `Drops in ${hours}h ${mins}m`;
  return `Drops in ${mins}m`;
}

function buildPopupContent(box: LootBox): string {
  const cat = CATEGORY_LABEL[box.category] || box.category;
  if (box.isActive) {
    return `
      <div class="popup-name">${box.businessName}</div>
      <div class="popup-value">${box.coupon.value}</div>
      <div class="popup-category">${cat}</div>
    `;
  }
  return `
    <div class="popup-name">${box.businessName}</div>
    <div class="popup-scheduled">${formatDropTime(box.dropTime)}</div>
    <div class="popup-category">${cat}</div>
  `;
}

/** Fit map to user location + nearby drops on first load */
function FitBounds({ userLocation, lootBoxes }: { userLocation: UserLocation | null; lootBoxes: LootBox[] }) {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current) return;
    if (!userLocation && lootBoxes.length === 0) return;

    const points: L.LatLngExpression[] = [];
    if (userLocation) {
      points.push([userLocation.latitude, userLocation.longitude]);
    }
    lootBoxes.forEach((box) => {
      points.push([box.latitude, box.longitude]);
    });

    if (points.length === 1) {
      map.setView(points[0] as [number, number], 15, { animate: true });
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }

    hasFit.current = true;
  }, [userLocation, lootBoxes, map]);

  return null;
}

/** Recenter button */
function RecenterButton({ userLocation }: { userLocation: UserLocation | null }) {
  const map = useMap();

  const handleRecenter = useCallback(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15, { animate: true });
    }
  }, [userLocation, map]);

  if (!userLocation) return null;

  return (
    <div className="recenter-btn" onClick={handleRecenter} title="Center on my location">
      📍
    </div>
  );
}

/** Cluster loot box markers using Leaflet.markercluster */
function MarkerCluster({
  lootBoxes,
  onLootBoxPress,
}: {
  lootBoxes: LootBox[];
  onLootBoxPress: (box: LootBox) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    // Wait for L.markerClusterGroup to be available (loaded via CDN script)
    const tryInit = () => {
      if (!(L as any).markerClusterGroup) {
        // Script hasn't loaded yet, retry
        setTimeout(tryInit, 100);
        return;
      }

      // Remove previous cluster group if it exists
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }

      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = 40;
          if (count >= 10) size = 50;
          if (count >= 50) size = 60;
          return L.divIcon({
            html: `<div style="
              width: ${size - 10}px; height: ${size - 10}px;
              display: flex; align-items: center; justify-content: center;
            ">${count}</div>`,
            className: "marker-cluster",
            iconSize: L.point(size, size),
          });
        },
      });

      lootBoxes.forEach((box) => {
        const marker = L.marker([box.latitude, box.longitude], {
          icon: lootBoxIcon(box.isActive, box.category),
        });
        marker.on("click", () => onLootBoxPress(box));
        marker.bindPopup(buildPopupContent(box));
        clusterGroup.addLayer(marker);
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    };

    tryInit();

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [lootBoxes, map, onLootBoxPress]);

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
    : [40.7128, -74.006];

  const tileUrl =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

  return (
    <MapContainer
      center={center}
      zoom={15}
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
              <div className="popup-name">You are here</div>
            </Popup>
          </Marker>
          {/* Faint range circle showing ~500m claim radius */}
          <Circle
            center={[userLocation.latitude, userLocation.longitude]}
            radius={500}
            pathOptions={{
              color: "#FF5722",
              fillColor: "#FF5722",
              fillOpacity: 0.04,
              weight: 1,
              opacity: 0.2,
              dashArray: "6 4",
            }}
          />
        </>
      )}

      <FitBounds userLocation={userLocation} lootBoxes={lootBoxes} />
      <RecenterButton userLocation={userLocation} />
      <MarkerCluster lootBoxes={lootBoxes} onLootBoxPress={onLootBoxPress} />
    </MapContainer>
  );
}
