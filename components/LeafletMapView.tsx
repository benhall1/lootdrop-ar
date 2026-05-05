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
    .lootbox-marker:hover { transform: scale(1.1) !important; z-index: 1000 !important; }
    .lda-pin-halo {
      animation: lda-pulse-glow 2s ease-in-out infinite;
    }
    @keyframes lda-pulse-glow {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    .user-marker {
      animation: lootdrop-pulse 2s ease-in-out infinite;
    }
    .marker-cluster {
      background: rgba(0, 229, 255, 0.2);
      border: 1.5px solid rgba(0, 229, 255, 0.5);
      border-radius: 50%;
      box-shadow: 0 0 16px rgba(0, 229, 255, 0.35);
    }
    .marker-cluster div {
      background: linear-gradient(180deg, #00E5FF, #00B8D4);
      color: #07091A;
      border-radius: 50%;
      font-weight: 900;
      font-size: 14px;
      font-family: 'Nunito', sans-serif;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 0 #006978;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px !important;
      background: rgba(15, 19, 38, 0.95) !important;
      backdrop-filter: blur(10px);
      border: 1.5px solid rgba(0, 229, 255, 0.3);
      box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 0 32px rgba(0, 229, 255, 0.2) !important;
      font-family: 'Nunito', system-ui, sans-serif !important;
    }
    .leaflet-popup-tip { background: rgba(15, 19, 38, 0.95) !important; }
    .leaflet-popup-content {
      margin: 12px 16px !important;
      font-size: 13px !important;
      color: #8E96C8 !important;
      line-height: 1.5 !important;
    }
    .leaflet-popup-content .popup-name {
      font-weight: 900;
      color: #FFFFFF;
      font-size: 15px;
      margin-bottom: 4px;
      letter-spacing: 0.3px;
    }
    .leaflet-popup-content .popup-value {
      color: #FFD54F;
      font-weight: 900;
      font-size: 18px;
      text-shadow: 0 0 12px rgba(255,213,79,0.4);
    }
    .leaflet-popup-content .popup-scheduled {
      color: #64748B;
      font-size: 12px;
      font-weight: 700;
    }
    .leaflet-popup-content .popup-category {
      display: inline-block;
      background: rgba(0,229,255,0.12);
      color: #00E5FF;
      font-size: 10px;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 6px;
      margin-top: 4px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .leaflet-popup-close-button { color: #64748B !important; }
    .leaflet-popup-close-button:hover { color: #00E5FF !important; }
    .recenter-btn {
      position: absolute; bottom: 24px; right: 16px; z-index: 1000;
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(180deg, #00E5FF, #00B8D4);
      border: 2px solid rgba(255,255,255,0.4);
      color: #07091A; font-size: 20px; font-weight: 900;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 0 #006978, 0 0 24px rgba(0,229,255,0.5);
      transition: transform 0.2s ease;
    }
    .recenter-btn:hover { transform: translateY(-2px); }
    .leaflet-control-zoom a {
      background: rgba(15, 19, 38, 0.9) !important;
      color: #8E96C8 !important;
      border-color: rgba(0, 229, 255, 0.2) !important;
      backdrop-filter: blur(10px);
    }
    .leaflet-control-zoom a:hover {
      background: rgba(0, 229, 255, 0.15) !important;
      color: #00E5FF !important;
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
  html: `<div style="position:relative;width:36px;height:36px;">
    <div style="position:absolute;inset:-12px;border-radius:50%;
      background:radial-gradient(circle,rgba(0,229,255,0.4),transparent 70%);
      animation:lda-pulse-glow 2s ease-in-out infinite;"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
      width:18px;height:18px;border-radius:50%;
      background:linear-gradient(180deg,#00E5FF,#00B8D4);
      border:3px solid #fff;
      box-shadow:0 0 16px rgba(0,229,255,0.7),0 2px 8px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const CATEGORY_LABEL: Record<string, string> = {
  restaurant: "Restaurant",
  retail: "Retail",
  entertainment: "Entertainment",
  services: "Services",
};

type Rarity = "gold" | "silver" | "bronze" | "epic";

const RARITY_COLORS: Record<Rarity, { c: string; d: string; g: string; chest: string }> = {
  gold: { c: "#FFD54F", d: "#B8860B", g: "rgba(255,213,79,0.6)", chest: "#5A3F00" },
  silver: { c: "#C0CAE0", d: "#5A6378", g: "rgba(192,202,224,0.5)", chest: "#2D3540" },
  bronze: { c: "#E89B5E", d: "#6B3D14", g: "rgba(232,155,94,0.5)", chest: "#3D2208" },
  epic: { c: "#C77DFF", d: "#5A189A", g: "rgba(199,125,255,0.6)", chest: "#240046" },
};

const CATEGORY_RARITY: Record<string, Rarity> = {
  restaurant: "gold",
  entertainment: "epic",
  retail: "silver",
  services: "bronze",
};

function formatRemaining(dropTime: number): string {
  const diff = dropTime - Date.now();
  if (diff <= 0) return "";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function lootBoxIcon(box: LootBox) {
  if (!box.isActive) {
    const timer = formatRemaining(box.dropTime);
    return L.divIcon({
      className: "lootbox-marker",
      html: `<div style="position:relative;width:36px;height:36px;opacity:0.55;">
        <div style="
          position:relative;width:36px;height:36px;
          background:linear-gradient(180deg,#3a4366,#1f2548);
          border-radius:18px 18px 18px 4px;
          transform:rotate(-45deg);
          border:2px solid rgba(255,255,255,0.2);
          box-shadow:0 3px 0 rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;">
          <div style="transform:rotate(45deg);font-size:14px;">⏳</div>
        </div>
        ${timer ? `<div style="position:absolute;top:-8px;right:-14px;
          padding:1px 6px;background:linear-gradient(180deg,#64748B,#475569);
          color:#fff;border-radius:999px;font-family:'JetBrains Mono',monospace;
          font-size:9px;font-weight:700;border:1.5px solid #fff;
          box-shadow:0 2px 0 rgba(0,0,0,0.4);">${timer}</div>` : ""}
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  }

  const rarity = CATEGORY_RARITY[box.category || ""] || "gold";
  const col = RARITY_COLORS[rarity];
  const size = 44;
  const chestColor = col.chest;
  const chestSize = Math.round(size * 0.55);

  return L.divIcon({
    className: "lootbox-marker",
    html: `<div style="position:relative;width:${size}px;height:${size + 12}px;">
      <div class="lda-pin-halo" style="
        position:absolute;top:-6px;left:50%;transform:translateX(-50%);
        width:${size + 24}px;height:${size + 24}px;border-radius:50%;
        background:radial-gradient(circle,${col.g} 0%,transparent 60%);
      "></div>
      <div style="
        position:relative;width:${size}px;height:${size}px;
        background:linear-gradient(180deg,${col.c},${col.d});
        border-radius:${size / 2}px ${size / 2}px ${size / 2}px 4px;
        transform:rotate(-45deg);
        border:2px solid #fff;
        box-shadow:0 4px 0 rgba(0,0,0,0.4),0 0 16px ${col.g},inset 0 2px 0 rgba(255,255,255,0.5);
        display:flex;align-items:center;justify-content:center;">
        <div style="transform:rotate(45deg);">
          <svg width="${chestSize}" height="${chestSize}" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="10" rx="1" fill="${chestColor}"/>
            <path d="M3 11Q3 5 12 5Q21 5 21 11Z" fill="${chestColor}"/>
            <rect x="10.5" y="8" width="3" height="6" fill="${chestColor}" stroke="${chestColor}" stroke-width="0.5"/>
          </svg>
        </div>
      </div>
    </div>`,
    iconSize: [size + 24, size + 12],
    iconAnchor: [(size + 24) / 2, size + 8],
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
          icon: lootBoxIcon(box),
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
