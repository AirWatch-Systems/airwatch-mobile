import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, get, toApiError } from "../services/api";
import type {
  PollutionCurrentResponse,
  PollutionHistoryPointDto,
  PollutionHistoryResponse,
} from "./types";

/**
 * usePollution
 * - RF04: fetch current indices and history (24h default)
 * - RF14: auto refresh every 15 minutes while in foreground
 */
export function usePollution(params: {
  lat?: number | null;
  lon?: number | null;
  hours?: number; // default: 24
  autoRefresh?: boolean; // default: true
}) {
  const { lat, lon, hours = 24, autoRefresh = true } = params;
  const [current, setCurrent] = useState<PollutionCurrentResponse | null>(null);
  const [history, setHistory] = useState<PollutionHistoryPointDto[] | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorCurrent, setErrorCurrent] = useState<ApiError | null>(null);
  const [errorHistory, setErrorHistory] = useState<ApiError | null>(null);

  const enabled = useMemo(() => typeof lat === "number" && typeof lon === "number", [lat, lon]);

  const fetchCurrent = useCallback(async () => {
    if (!enabled) return null;
    setIsLoadingCurrent(true);
    setErrorCurrent(null);
    try {
      const data = await get<PollutionCurrentResponse>(`/api/pollution/current`, {
        params: { lat, lon },
      });
      setCurrent(data);
      return data;
    } catch (e) {
      const err = toApiError(e);
      setErrorCurrent(err);
      throw err;
    } finally {
      setIsLoadingCurrent(false);
    }
  }, [enabled, lat, lon]);

  const fetchHistory = useCallback(async () => {
    if (!enabled) return null;
    setIsLoadingHistory(true);
    setErrorHistory(null);
    try {
      const data = await get<PollutionHistoryResponse>(`/api/pollution/history`, {
        params: { lat, lon, hours },
      });
      setHistory(data.data ?? []);
      return data.data ?? [];
    } catch (e) {
      const err = toApiError(e);
      setErrorHistory(err);
      throw err;
    } finally {
      setIsLoadingHistory(false);
    }
  }, [enabled, lat, lon, hours]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    fetchCurrent();
    fetchHistory();
  }, [enabled, fetchCurrent, fetchHistory]);

  // Auto refresh (foreground timer)
  useEffect(() => {
    if (!enabled || !autoRefresh) return;
    const t = setInterval(() => {
      fetchCurrent();
    }, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(t);
  }, [enabled, autoRefresh, fetchCurrent]);

  return {
    current,
    history,
    isLoadingCurrent,
    isLoadingHistory,
    errorCurrent,
    errorHistory,
    refetchCurrent: fetchCurrent,
    refetchHistory: fetchHistory,
  };
}