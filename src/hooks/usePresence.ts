import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Point, PresencePointer, UserName } from '../types'

const colorByName: Record<UserName, string> = {
  Jordan: '#ff7a90',
  Camila: '#3aa6a1',
  Ari: '#8c6ee8',
}

type PresencePayload = Partial<PresencePointer> & {
  online_at?: string
}

export const getUserColor = (name: UserName) => colorByName[name]

export const usePresence = (userName: UserName | null) => {
  const [pointers, setPointers] = useState<PresencePointer[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const latestPoint = useRef<Point | null>(null)
  const lastSentAt = useRef(0)
  const throttleTimer = useRef<number | null>(null)

  useEffect(() => {
    const client = supabase

    if (!client || !userName) {
      return
    }

    const channel = client.channel('apartment-presence', {
      config: {
        presence: {
          key: `${userName}-${crypto.randomUUID()}`,
        },
      },
    })

    const syncPresence = () => {
      const state = channel.presenceState() as Record<
        string,
        PresencePayload[]
      >

      const next = Object.values(state)
        .flat()
        .filter((presence): presence is PresencePointer =>
          Boolean(
            presence.name &&
              presence.color &&
              Number.isFinite(presence.x) &&
              Number.isFinite(presence.y),
          ),
        )
        .map((presence) => ({
          name: presence.name,
          color: presence.color,
          x: Number(presence.x),
          y: Number(presence.y),
          seenAt: Number(presence.seenAt ?? Date.now()),
        }))

      setPointers(next)
    }

    channel.on('presence', { event: 'sync' }, syncPresence)

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          name: userName,
          color: getUserColor(userName),
          x: 0,
          y: 0,
          seenAt: Date.now(),
        })
      }
    })

    channelRef.current = channel

    return () => {
      if (throttleTimer.current) {
        window.clearTimeout(throttleTimer.current)
      }

      channelRef.current = null
      void client.removeChannel(channel)
    }
  }, [userName])

  const flushPresence = useCallback(() => {
    const point = latestPoint.current
    const channel = channelRef.current

    if (!point || !channel || !userName) {
      return
    }

    lastSentAt.current = Date.now()
    void channel.track({
      name: userName,
      color: getUserColor(userName),
      x: point.x,
      y: point.y,
      seenAt: lastSentAt.current,
    })
  }, [userName])

  const updatePointer = useCallback(
    (point: Point) => {
      latestPoint.current = point

      if (!channelRef.current) {
        return
      }

      const now = Date.now()
      const remaining = Math.max(0, 70 - (now - lastSentAt.current))

      if (remaining === 0) {
        if (throttleTimer.current) {
          window.clearTimeout(throttleTimer.current)
          throttleTimer.current = null
        }
        flushPresence()
        return
      }

      if (!throttleTimer.current) {
        throttleTimer.current = window.setTimeout(() => {
          throttleTimer.current = null
          flushPresence()
        }, remaining)
      }
    },
    [flushPresence],
  )

  return useMemo(
    () => ({
      pointers: supabase && userName ? pointers : [],
      updatePointer,
      isRealtimePresenceOn: Boolean(supabase && userName),
    }),
    [pointers, updatePointer, userName],
  )
}
