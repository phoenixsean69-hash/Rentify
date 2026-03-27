// lib/useAppwrite.ts - Updated with TTL support
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

// lib/appwrite.ts

interface UseAppwriteOptions<T, P extends Record<string, string | number>> {
  fn: (params: P) => Promise<T>;
  params?: P;
  skip?: boolean;
  ttl?: number; // Add TTL parameter
}

interface UseAppwriteReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams: P) => Promise<void>;
}

// Simple cache storage
const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30000; // 30 seconds default

export const useAppwrite = <T, P extends Record<string, string | number>>({
  fn,
  params = {} as P,
  skip = false,
  ttl = DEFAULT_TTL,
}: UseAppwriteOptions<T, P>): UseAppwriteReturn<T, P> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${fn.name}_${JSON.stringify(params)}`;

  const fetchData = useCallback(
    async (fetchParams: P, forceRefresh = false) => {
      const key = `${fn.name}_${JSON.stringify(fetchParams)}`;

      // Check cache
      if (!forceRefresh) {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fn(fetchParams);
        setData(result);
        cache.set(key, { data: result, timestamp: Date.now() });
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fn, ttl],
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  }, []);

  const refetch = async (newParams: P) => {
    await fetchData(newParams, true);
  };

  return { data, loading, error, refetch };
};
