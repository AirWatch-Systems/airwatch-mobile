import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import { ApiError, get, post, toApiError } from "../services/api";
import type {
  FeedbackListRequest,
  FeedbackItemDto,
  FeedbackListResponse,
  FeedbackCreateRequest,
  FeedbackCreateResponse,
  LocationResultDto,
  LocationSearchResponse,
  RegionMarkerDto,
  MarkersResponse,
} from "./types";

/**
 * useLocationPermission
 * - Requests/returns foreground location permission state.
 * - RF03: permission management.
 */
export function useLocationPermission() {
  const [status, setStatus] = useState<Location.PermissionStatus | null>(null);
  const [canAskAgain, setCanAskAgain] = useState<boolean>(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    setError(null);
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      setStatus(res.status);
      setCanAskAgain(res.canAskAgain);
      return res;
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Falha ao solicitar permissão de localização.");
      setError(err);
      throw err;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cur = await Location.getForegroundPermissionsAsync();
        setStatus(cur.status);
        setCanAskAgain(cur.canAskAgain);
      } catch {
        // Ignore; user can manually request
      }
    })();
  }, []);

  const hasPermission = status === Location.PermissionStatus.GRANTED;

  return {
    status,
    canAskAgain,
    hasPermission,
    isRequesting,
    error,
    requestPermission,
  };
}

/**
 * useCurrentLocation
 * - RF03: fetch current GPS coordinates and resolve a human-readable region name
 *   using reverseGeocodeAsync (device-based; no external API keys exposed).
 */
export function useCurrentLocation(enabled: boolean = true) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = Number(pos.coords.latitude.toFixed(6));
      const lon = Number(pos.coords.longitude.toFixed(6));
      setCoords({ lat, lon });

      // Reverse geocode to a display name (no Google key here)
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (places.length > 0) {
        const p = places[0];
        const name = [p.city, p.region, p.country].filter(Boolean).join(", ");
        setRegionName(name || null);
      } else {
        setRegionName(null);
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Não foi possível obter a localização.");
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchLocation();
  }, [enabled, fetchLocation]);

  return { coords, regionName, isLoading, error, refetch: fetchLocation };
}

/**
 * useFeedbacks
 * - RF05: list feedbacks by location/time window
 */
export function useFeedbacks(params: FeedbackListRequest | null) {
  const [items, setItems] = useState<FeedbackItemDto[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    if (!params) return null;
    const { lat, lon, radius = 5, hours = 12 } = params;
    setIsLoading(true);
    setError(null);
    try {
      const data = await get<FeedbackListResponse>(`/api/feedbacks`, {
        params: { lat, lon, radius, hours },
      });
      setItems(data.feedbacks ?? []);
      return data.feedbacks ?? [];
    } catch (e) {
      const err = toApiError(e);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  return { items, isLoading, error, refetch: fetchFeedbacks };
}

/**
 * useSubmitFeedback
 * - RF06: post feedback with rating/comment
 */
export function useSubmitFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastFeedbackId, setLastFeedbackId] = useState<string | null>(null);

  const submit = useCallback(async (data: FeedbackCreateRequest) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await post<FeedbackCreateResponse, FeedbackCreateRequest>(`/api/feedbacks`, data);
      setLastFeedbackId(res.feedbackId);
      return res;
    } catch (e) {
      const err = toApiError(e);
      setError(err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, error, lastFeedbackId };
}

/**
 * useSearchLocations
 * - RF07: text-based search of other cities/regions
 */
export function useSearchLocations() {
  const [results, setResults] = useState<LocationResultDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return [];
    }
    setIsSearching(true);
    setError(null);
    try {
      const res = await get<LocationSearchResponse>(`/api/locations/search`, {
        params: { query: query.trim() },
      });
      setResults(res.results ?? []);
      return res.results ?? [];
    } catch (e) {
      const err = toApiError(e);
      setError(err);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, isSearching, error, search };
}

/**
 * useMarkers
 * - RF08: fetch region markers within map bounds
 */
export function useMarkers() {
  const [markers, setMarkers] = useState<RegionMarkerDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchMarkers = useCallback(
    async (bounds: { lat1: number; lon1: number; lat2: number; lon2: number }) => {
      const boundsStr = `${bounds.lat1},${bounds.lon1},${bounds.lat2},${bounds.lon2}`;
      setIsLoading(true);
      setError(null);
      try {
        const res = await get<MarkersResponse>(`/api/locations/markers`, {
          params: { bounds: boundsStr },
        });
        setMarkers(res.markers ?? []);
        return res.markers ?? [];
      } catch (e) {
        const err = toApiError(e);
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { markers, isLoading, error, fetchMarkers };
}