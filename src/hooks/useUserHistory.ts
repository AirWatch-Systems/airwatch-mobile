import { useCallback, useEffect, useState } from "react";
import { ApiError, get, toApiError } from "../services/api";
import type { UserHistoryResponse } from "../types";

/**
 * useUserHistory
 * - RF10: personal history of feedbacks and searches
 */
export function useUserHistory(enabled: boolean) {
  const [data, setData] = useState<UserHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!enabled) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await get<UserHistoryResponse>(`/api/user/history`);
      setData(res);
      return res;
    } catch (e) {
      const err = toApiError(e);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchHistory();
  }, [enabled, fetchHistory]);

  return { data, isLoading, error, refetch: fetchHistory };
}