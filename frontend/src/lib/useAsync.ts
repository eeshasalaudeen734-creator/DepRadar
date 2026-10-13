import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: Error }
  | { status: "success"; data: T };

type Settled<T> = Exclude<AsyncState<T>, { status: "loading" }>;

/**
 * Runs `fn` on mount and whenever `key` changes; `reload()` re-runs it.
 * Results from a stale `key` are ignored, so fast navigation can't show the
 * wrong bounty.
 */
export function useAsync<T>(fn: () => Promise<T>, key: string): AsyncState<T> & { reload: () => void } {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const requestKey = `${key}#${nonce}`;

  const [settled, setSettled] = useState<{ key: string; state: Settled<T> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fnRef.current().then(
      (data) => !cancelled && setSettled({ key: requestKey, state: { status: "success", data } }),
      (err: unknown) =>
        !cancelled &&
        setSettled({
          key: requestKey,
          state: { status: "error", error: err instanceof Error ? err : new Error(String(err)) },
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const state: AsyncState<T> = settled?.key === requestKey ? settled.state : { status: "loading" };
  return { ...state, reload };
}
