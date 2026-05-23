import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFurnitureItem, isFurnitureType } from '../data/furniture'
import { supabase } from '../lib/supabase'
import type { FurnitureItem, SyncState, UserName } from '../types'

type FurnitureRow = {
  id: string
  type: string
  x: number | string
  y: number | string
  rotation: number | string | null
  width: number | string
  height: number | string
  created_by: string | null
  updated_at: string | null
}

type UpdateOptions = {
  live?: boolean
  persist?: boolean
}

const LOCAL_STORAGE_KEY = 'cozy-apartment-furniture'

const fromRow = (row: FurnitureRow): FurnitureItem | null => {
  if (!isFurnitureType(row.type)) {
    return null
  }

  return {
    id: row.id,
    type: row.type,
    x: Number(row.x),
    y: Number(row.y),
    rotation: Number(row.rotation ?? 0),
    width: Number(row.width),
    height: Number(row.height),
    createdBy: row.created_by ?? 'Jordan',
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}

const toRow = (item: FurnitureItem): FurnitureRow => ({
  id: item.id,
  type: item.type,
  x: item.x,
  y: item.y,
  rotation: item.rotation,
  width: item.width,
  height: item.height,
  created_by: item.createdBy,
  updated_at: item.updatedAt,
})

const saveLocal = (items: FurnitureItem[]) => {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
}

const loadLocal = (): FurnitureItem[] => {
  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as FurnitureItem[]
  } catch {
    return []
  }
}

const upsertIntoList = (
  items: FurnitureItem[],
  nextItem: FurnitureItem,
): FurnitureItem[] => {
  const existingIndex = items.findIndex((item) => item.id === nextItem.id)

  if (existingIndex === -1) {
    return [...items, nextItem]
  }

  const next = [...items]
  next[existingIndex] = nextItem
  return next
}

export const useFurnitureSync = (userName: UserName | null) => {
  const [items, setItems] = useState<FurnitureItem[]>(() =>
    supabase ? [] : loadLocal(),
  )
  const [syncState, setSyncState] = useState<SyncState>(
    supabase ? 'connecting' : 'local',
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const itemsRef = useRef<FurnitureItem[]>([])
  const saveTimers = useRef<Record<string, number>>({})

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const replaceItems = useCallback((next: FurnitureItem[]) => {
    setItems(next)
    itemsRef.current = next

    if (!supabase) {
      saveLocal(next)
      setLastSavedAt(new Date().toISOString())
    }
  }, [])

  const persistItem = useCallback(async (item: FurnitureItem) => {
    const client = supabase

    if (!client) {
      saveLocal(upsertIntoList(itemsRef.current, item))
      setLastSavedAt(new Date().toISOString())
      return
    }

    setSyncState('saving')
    const { error } = await client.from('furniture_items').upsert(toRow(item))

    if (error) {
      setSyncState('error')
      setErrorMessage(error.message)
      return
    }

    setSyncState('connected')
    setLastSavedAt(new Date().toISOString())
  }, [])

  const schedulePersist = useCallback(
    (item: FurnitureItem, delay: number) => {
      window.clearTimeout(saveTimers.current[item.id])
      saveTimers.current[item.id] = window.setTimeout(() => {
        void persistItem(item)
      }, delay)
    },
    [persistItem],
  )

  useEffect(() => {
    const client = supabase

    if (!client) {
      return
    }

    let isMounted = true

    const loadRemoteItems = async () => {
      setSyncState('connecting')
      const { data, error } = await client
        .from('furniture_items')
        .select('*')
        .order('updated_at', { ascending: true })

      if (!isMounted) {
        return
      }

      if (error) {
        setSyncState('error')
        setErrorMessage(error.message)
        return
      }

      setItems(
        ((data ?? []) as FurnitureRow[])
          .map(fromRow)
          .filter((item): item is FurnitureItem => item !== null),
      )
    }

    void loadRemoteItems()

    const channel = client
      .channel('furniture-items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'furniture_items' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string }).id
            if (!deletedId) {
              return
            }

            setItems((current) =>
              current.filter((item) => item.id !== deletedId),
            )
            return
          }

          const nextItem = fromRow(payload.new as FurnitureRow)
          if (!nextItem) {
            return
          }

          setItems((current) => upsertIntoList(current, nextItem))
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSyncState('connected')
        }
      })

    return () => {
      isMounted = false
      void client.removeChannel(channel)
    }
  }, [])

  const addFurniture = useCallback(
    (type: FurnitureItem['type']) => {
      if (!userName) {
        return null
      }

      const item = createFurnitureItem(type, userName)
      replaceItems(upsertIntoList(itemsRef.current, item))
      void persistItem(item)
      return item.id
    },
    [persistItem, replaceItems, userName],
  )

  const updateFurniture = useCallback(
    (id: string, patch: Partial<FurnitureItem>, options?: UpdateOptions) => {
      const existing = itemsRef.current.find((item) => item.id === id)

      if (!existing) {
        return
      }

      const nextItem = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      }
      const nextItems = upsertIntoList(itemsRef.current, nextItem)
      replaceItems(nextItems)

      if (options?.persist === false) {
        return
      }

      schedulePersist(nextItem, options?.live ? 90 : 250)
    },
    [replaceItems, schedulePersist],
  )

  const deleteFurniture = useCallback(
    async (id: string) => {
      const next = itemsRef.current.filter((item) => item.id !== id)
      replaceItems(next)

      const client = supabase

      if (!client) {
        return
      }

      const { error } = await client.from('furniture_items').delete().eq('id', id)

      if (error) {
        setSyncState('error')
        setErrorMessage(error.message)
      }
    },
    [replaceItems],
  )

  const saveAll = useCallback(async () => {
    const client = supabase

    if (!client) {
      saveLocal(itemsRef.current)
      setLastSavedAt(new Date().toISOString())
      return
    }

    setSyncState('saving')
    const rows = itemsRef.current.map(toRow)

    if (rows.length === 0) {
      setSyncState('connected')
      setLastSavedAt(new Date().toISOString())
      return
    }

    const { error } = await client.from('furniture_items').upsert(rows)

    if (error) {
      setSyncState('error')
      setErrorMessage(error.message)
      return
    }

    setSyncState('connected')
    setLastSavedAt(new Date().toISOString())
  }, [])

  const resetFurniture = useCallback(async () => {
    const ids = itemsRef.current.map((item) => item.id)
    replaceItems([])

    const client = supabase

    if (!client || ids.length === 0) {
      return
    }

    const { error } = await client.from('furniture_items').delete().in('id', ids)

    if (error) {
      setSyncState('error')
      setErrorMessage(error.message)
    }
  }, [replaceItems])

  return useMemo(
    () => ({
      items,
      syncState,
      lastSavedAt,
      errorMessage,
      addFurniture,
      updateFurniture,
      deleteFurniture,
      saveAll,
      resetFurniture,
    }),
    [
      addFurniture,
      deleteFurniture,
      errorMessage,
      items,
      lastSavedAt,
      resetFurniture,
      saveAll,
      syncState,
      updateFurniture,
    ],
  )
}
