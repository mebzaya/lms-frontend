import { useEffect, useRef } from 'react'

/**
 * Drop-in replacement for `useEffect(effect, deps)` that skips running
 * `effect` again if the previous call already ran with an identical
 * `deps` array.
 *
 * This absorbs React 18 StrictMode's development-only double-invocation
 * of mount effects — which otherwise fires every data-fetching effect
 * (e.g. `useEffect(() => loadUsers(), [])`) twice in a row — while still
 * re-running normally whenever a dependency value actually changes.
 */
export function useEffectDeduped(effect, deps) {
  const lastKey = useRef()

  useEffect(() => {
    const key = JSON.stringify(deps)
    if (lastKey.current === key) return
    lastKey.current = key
    effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
