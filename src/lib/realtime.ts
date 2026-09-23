import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type ChannelOptions = Parameters<typeof supabase.channel>[1]

// Pending removals, per topic.
const removals = new Map<string, Promise<unknown>>()

/**
 * Opens a Realtime channel and returns its cleanup, for use in effects.
 *
 * supabase.channel(topic) hands back the *existing* channel when one with
 * the same topic is still registered, and removeChannel() only unregisters
 * it once the server acknowledges the leave. So an unmount followed by a
 * quick remount (StrictMode in dev, or navigating away and straight back)
 * would get the channel that's being torn down, and its listeners would
 * silently die with it. Waiting for the previous removal avoids that.
 */
export function openChannel(
  topic: string,
  options: ChannelOptions,
  setup: (channel: RealtimeChannel) => void,
): () => void {
  let channel: RealtimeChannel | null = null
  let cancelled = false

  const previous = removals.get(topic) ?? Promise.resolve()
  previous.then(() => {
    if (cancelled) return
    channel = supabase.channel(topic, options)
    setup(channel)
  })

  return () => {
    cancelled = true
    if (channel) {
      const removal = supabase.removeChannel(channel)
      removals.set(topic, removal)
      removal.finally(() => {
        if (removals.get(topic) === removal) removals.delete(topic)
      })
    }
  }
}
