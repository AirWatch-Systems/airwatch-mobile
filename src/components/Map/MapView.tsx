import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  Text,
} from "react-native";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id?: string;
  lat: number;
  lon: number;
  title?: string;
  description?: string;
  color?: string;
}

export interface MapViewProps {
  style?: StyleProp<ViewStyle>;
  region?: Region;
  initialRegion?: Region;
  markers?: MapMarker[];
  onRegionChangeComplete?: (region: Region) => void;
  googleMapsApiKey?: string; // optional override; falls back to EXPO_PUBLIC_GOOGLE_MAPS_API_KEY on web
}

/**
 * Web-only MapView implemented with Google Maps JavaScript API.
 * It intentionally does NOT import react-native-maps to avoid bundling native-only modules on web.
 */
const MapViewWeb: React.FC<MapViewProps> = ({
  style,
  region,
  initialRegion,
  markers = [],
  onRegionChangeComplete,
  googleMapsApiKey,
}) => {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any | null>(null);
  const gMarkersRef = useRef<any[]>([]);
  const idleListenerRef = useRef<any>(null);

  const apiKey =
    googleMapsApiKey ||
    (typeof process !== "undefined"
      ? (process.env as any).EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      : undefined);

  const startRegion = useMemo<Region>(() => {
    if (region) return region;
    if (initialRegion) return initialRegion;
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 60,
      longitudeDelta: 60,
    };
  }, [region, initialRegion]);

  // Helpers bound to component scope (web markers)
  const clearGoogleMarkers = () => {
    if (!gMarkersRef.current.length) return;
    gMarkersRef.current.forEach((m) => {
      try {
        m.setMap(null);
      } catch {
        // ignore
      }
    });
    gMarkersRef.current = [];
  };

  const renderGoogleMarkers = (g: any, map: any, points: MapMarker[]) => {
    clearGoogleMarkers();
    points.forEach((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lon },
        map,
        title: p.title,
        icon: p.color
          ? {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: p.color,
              fillOpacity: 1,
              strokeColor: "#000",
              strokeWeight: 1,
            }
          : undefined,
      });
      if (p.description) {
        const info = new g.maps.InfoWindow({
          content: `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; font-size: 12px;">${escapeHtml(
            p.description,
          )}</div>`,
        });
        marker.addListener("click", () => {
          info.open({ map, anchor: marker });
        });
      }
      gMarkersRef.current.push(marker);
    });
  };

  // Init map
  useEffect(() => {
    let canceled = false;

    const load = async () => {
      try {
        const g = await ensureGoogleMaps(apiKey);
        if (canceled) return;

        const node = containerRef.current as unknown as HTMLDivElement | null;
        if (!node) return;

        const mapOptions = toGoogleMapOptions(startRegion);
        const map = new g.maps.Map(node, mapOptions);
        mapRef.current = map;

        if (idleListenerRef.current) {
          g.maps.event.removeListener(idleListenerRef.current);
          idleListenerRef.current = null;
        }
        idleListenerRef.current = map.addListener("idle", () => {
          if (!onRegionChangeComplete) return;
          const bounds = map.getBounds?.();
          const center = map.getCenter?.();
          if (!bounds || !center) return;

          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();

          const latDelta = Math.abs(ne.lat() - sw.lat());
          const lonDelta = Math.abs(ne.lng() - sw.lng());
          onRegionChangeComplete({
            latitude: center.lat(),
            longitude: center.lng(),
            latitudeDelta: latDelta || 0.01,
            longitudeDelta: lonDelta || 0.01,
          });
        });

        renderGoogleMarkers(g, map, markers);
      } catch {
        // silently ignore; UI fallback below handles missing API key
      }
    };

    load();

    return () => {
      canceled = true;
      clearGoogleMarkers();
      try {
        if (idleListenerRef.current && (window as any).google?.maps?.event) {
          (window as any).google.maps.event.removeListener(
            idleListenerRef.current,
          );
        }
      } catch {
        // ignore
      }
      idleListenerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center/zoom when region prop changes
  useEffect(() => {
    if (!mapRef.current || !region) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    const map = mapRef.current;
    map.setCenter({ lat: region.latitude, lng: region.longitude });

    const zoom = deltaToZoom(region.latitudeDelta);
    if (typeof zoom === "number") {
      map.setZoom(zoom);
    }
  }, [region]);

  // Update markers on change
  useEffect(() => {
    if (!mapRef.current) return;
    const g = (window as any).google;
    if (!g?.maps) return;

    renderGoogleMarkers(g, mapRef.current, markers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  if (!apiKey) {
    return (
      <View style={[styles.webFallback, style]}>
        <Text style={styles.fallbackText}>
          Google Maps API key ausente. Defina EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.
        </Text>
      </View>
    );
  }

  return <View ref={containerRef} style={[styles.webContainer, style]} />;
};

/* ===========================
 * Helpers (Web)
 * =========================== */

function toGoogleMapOptions(region: Region) {
  const zoom = deltaToZoom(region.latitudeDelta);
  return {
    center: { lat: region.latitude, lng: region.longitude },
    zoom: typeof zoom === "number" ? zoom : 3,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
  };
}

// Rough approximation converting latitudeDelta to Google Maps zoom
function deltaToZoom(latitudeDelta: number): number {
  const clampDelta = Math.max(0.0001, Math.min(360, latitudeDelta));
  const zoom = Math.log2(360 / clampDelta);
  return Math.max(1, Math.min(20, Math.round(zoom)));
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Load Google Maps JS API once and cache the promise on window
async function ensureGoogleMaps(apiKey?: string): Promise<any> {
  if (!apiKey) {
    throw new Error(
      "Google Maps API key is required. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY or pass googleMapsApiKey prop.",
    );
  }

  const w = window as any;
  if (w.google?.maps) return w.google;

  if (w.__googleMapsLoadPromise) {
    return w.__googleMapsLoadPromise;
  }

  w.__googleMapsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(
      "__googleMapsScript",
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(w.google));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "__googleMapsScript";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=places`;
    script.onload = () => resolve(w.google);
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return w.__googleMapsLoadPromise;
}

/* ===========================
 * Styles
 * =========================== */

const styles = StyleSheet.create({
  webContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#0b1220",
    borderRadius: 12,
    overflow: "hidden",
  },
  webFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1220",
    borderRadius: 12,
    padding: 12,
  },
  fallbackText: {
    color: "#cbd5e1",
    fontSize: 12,
  },
});

export default MapViewWeb;
