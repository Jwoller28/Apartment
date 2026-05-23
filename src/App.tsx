import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  LogOut,
  Map,
  RotateCcw,
  Save,
  Settings2,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { ApartmentCanvas } from './components/ApartmentCanvas'
import { FurniturePalette } from './components/FurniturePalette'
import { NameGate } from './components/NameGate'
import { useFurnitureSync } from './hooks/useFurnitureSync'
import { usePresence } from './hooks/usePresence'
import { isSupabaseConfigured } from './lib/supabase'
import {
  floorPlan,
  PX_PER_FOOT,
  type FloorPlanData,
  type RoomZone,
  type ZoneName,
} from './data/floorPlan'
import type { FurnitureType } from './data/furniture'
import type { UserName } from './types'

const NAME_STORAGE_KEY = 'cozy-apartment-user'
const MAP_STORAGE_KEY = 'cozy-apartment-map-draft-v2'
const users: UserName[] = ['Jordan', 'Camila', 'Ari']

const getStoredUser = (): UserName | null => {
  const stored = window.localStorage.getItem(NAME_STORAGE_KEY)

  return users.includes(stored as UserName) ? (stored as UserName) : null
}

const cloneFloorPlan = (): FloorPlanData =>
  JSON.parse(JSON.stringify(floorPlan)) as FloorPlanData

const loadMapDraft = (): FloorPlanData => {
  const raw = window.localStorage.getItem(MAP_STORAGE_KEY)

  if (!raw) {
    return cloneFloorPlan()
  }

  try {
    const parsed = JSON.parse(raw) as FloorPlanData

    if (Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
      return parsed
    }
  } catch {
    return cloneFloorPlan()
  }

  return cloneFloorPlan()
}

const shiftPoints = (points: number[] | undefined, dx: number, dy: number) =>
  points?.map((value, index) => value + (index % 2 === 0 ? dx : dy))

const getRoomBounds = (room: RoomZone) => {
  if (!room.points?.length) {
    return {
      x: room.x,
      y: room.y,
      width: room.width,
      height: room.height,
    }
  }

  const xValues = room.points.filter((_, index) => index % 2 === 0)
  const yValues = room.points.filter((_, index) => index % 2 === 1)
  const x = Math.min(...xValues)
  const y = Math.min(...yValues)

  return {
    x,
    y,
    width: Math.max(...xValues) - x,
    height: Math.max(...yValues) - y,
  }
}

const scaleNumbers = (values: number[], factor: number) =>
  values.map((value) => value * factor)

const scaleFloorPlan = (plan: FloorPlanData, factor: number): FloorPlanData => ({
  ...plan,
  width: plan.width * factor,
  height: plan.height * factor,
  rooms: plan.rooms.map((room) => ({
    ...room,
    x: room.x * factor,
    y: room.y * factor,
    width: room.width * factor,
    height: room.height * factor,
    points: room.points ? scaleNumbers(room.points, factor) : undefined,
  })),
  angledWalls: plan.angledWalls.map((points) => scaleNumbers(points, factor)),
  counters: plan.counters.map((counter) => ({
    x: counter.x * factor,
    y: counter.y * factor,
    width: counter.width * factor,
    height: counter.height * factor,
  })),
  openings: plan.openings.map((opening) => ({
    x1: opening.x1 * factor,
    y1: opening.y1 * factor,
    x2: opening.x2 * factor,
    y2: opening.y2 * factor,
  })),
})

function App() {
  const [userName, setUserName] = useState<UserName | null>(() => getStoredUser())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mapDraft, setMapDraft] = useState<FloorPlanData>(() => loadMapDraft())
  const [isMapEditing, setIsMapEditing] = useState(false)
  const [selectedRoomName, setSelectedRoomName] = useState<ZoneName>('Living Room')
  const [mapSavedAt, setMapSavedAt] = useState<string | null>(() =>
    window.localStorage.getItem(`${MAP_STORAGE_KEY}-saved-at`),
  )
  const [mapCopyStatus, setMapCopyStatus] = useState<string | null>(null)
  const {
    items,
    syncState,
    lastSavedAt,
    errorMessage,
    addFurniture,
    updateFurniture,
    deleteFurniture,
    saveAll,
    resetFurniture,
  } = useFurnitureSync(userName)
  const { pointers, updatePointer } = usePresence(userName)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )
  const selectedRoom = useMemo(
    () => mapDraft.rooms.find((room) => room.name === selectedRoomName) ?? null,
    [mapDraft.rooms, selectedRoomName],
  )

  useEffect(() => {
    if (userName) {
      window.localStorage.setItem(NAME_STORAGE_KEY, userName)
    }
  }, [userName])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault()
        void deleteFurniture(selectedId)
        setSelectedId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteFurniture, selectedId])

  const handleChooseName = useCallback((name: UserName) => {
    setUserName(name)
  }, [])

  const handleReset = useCallback(() => {
    const shouldReset = window.confirm('Reset all furniture in the shared apartment?')

    if (shouldReset) {
      setSelectedId(null)
      void resetFurniture()
    }
  }, [resetFurniture])

  const handleAddFurniture = useCallback(
    (type: FurnitureType) => {
      const newItemId = addFurniture(type)

      if (newItemId) {
        setSelectedId(newItemId)
      }
    },
    [addFurniture],
  )

  const handleMoveRoom = useCallback((name: ZoneName, dx: number, dy: number) => {
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      return
    }

    setMapDraft((current) => ({
      ...current,
      rooms: current.rooms.map((room) =>
        room.name === name
          ? {
              ...room,
              x: room.x + dx,
              y: room.y + dy,
              points: shiftPoints(room.points, dx, dy),
            }
          : room,
      ),
    }))
  }, [])

  const handleResizeSelectedRoom = useCallback(
    (scaleX: number, scaleY: number) => {
      setMapDraft((current) => ({
        ...current,
        rooms: current.rooms.map((room) => {
          if (room.name !== selectedRoomName) {
            return room
          }

          const bounds = getRoomBounds(room)
          const width = Math.max(PX_PER_FOOT * 2, room.width * scaleX)
          const height = Math.max(PX_PER_FOOT * 2, room.height * scaleY)

          return {
            ...room,
            x: bounds.x,
            y: bounds.y,
            width,
            height,
            points: room.points?.map((value, index) =>
              index % 2 === 0
                ? bounds.x + (value - bounds.x) * scaleX
                : bounds.y + (value - bounds.y) * scaleY,
            ),
          }
        }),
      }))
    },
    [selectedRoomName],
  )

  const handleScaleMap = useCallback((factor: number) => {
    setMapDraft((current) => scaleFloorPlan(current, factor))
  }, [])

  const handleNudgeSelectedRoom = useCallback(
    (dxFeet: number, dyFeet: number) => {
      handleMoveRoom(
        selectedRoomName,
        dxFeet * PX_PER_FOOT,
        dyFeet * PX_PER_FOOT,
      )
    },
    [handleMoveRoom, selectedRoomName],
  )

  const handleSaveMap = useCallback(() => {
    const savedAt = new Date().toISOString()
    window.localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapDraft))
    window.localStorage.setItem(`${MAP_STORAGE_KEY}-saved-at`, savedAt)
    setMapSavedAt(savedAt)
    setMapCopyStatus('Saved')
  }, [mapDraft])

  const handleCopyMap = useCallback(async () => {
    const payload = JSON.stringify(mapDraft, null, 2)

    try {
      await navigator.clipboard.writeText(payload)
      setMapCopyStatus('Copied')
    } catch {
      window.prompt('Copy this map JSON:', payload)
      setMapCopyStatus('Ready')
    }
  }, [mapDraft])

  const handleResetMap = useCallback(() => {
    const shouldReset = window.confirm('Reset the map draft back to the built-in plan?')

    if (!shouldReset) {
      return
    }

    const freshPlan = cloneFloorPlan()
    window.localStorage.removeItem(MAP_STORAGE_KEY)
    window.localStorage.removeItem(`${MAP_STORAGE_KEY}-saved-at`)
    setMapDraft(freshPlan)
    setSelectedRoomName('Living Room')
    setMapSavedAt(null)
    setMapCopyStatus('Reset')
  }, [])

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return 'Not saved yet'
    }

    return `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })}`
  }, [lastSavedAt])
  const mapSavedLabel = useMemo(() => {
    if (!mapSavedAt) {
      return 'Map not saved'
    }

    return `Map saved ${new Date(mapSavedAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })}`
  }, [mapSavedAt])

  const setupMessage = useMemo(() => {
    if (!errorMessage) {
      return null
    }

    if (errorMessage.includes('furniture_items')) {
      return 'Run supabase/schema.sql in Supabase SQL editor to finish realtime setup.'
    }

    return errorMessage
  }, [errorMessage])

  return (
    <div className="app-shell">
      {!userName && <NameGate onChoose={handleChooseName} />}
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            A
          </span>
          <div>
            <h1>Apartment</h1>
            <div className="status-row">
              <span className={`status-dot ${syncState}`} />
              <span>
                {syncState === 'local'
                  ? 'Local'
                  : syncState === 'saving'
                    ? 'Saving'
                    : syncState === 'error'
                      ? 'Needs setup'
                      : 'Live'}
              </span>
              <span>{lastSavedLabel}</span>
            </div>
          </div>
        </div>
        <div className="top-actions">
          <span className="active-user">
            <UsersRound size={17} />
            {userName ?? 'Pick name'}
          </span>
          <button type="button" className="icon-button text-button" onClick={() => void saveAll()}>
            <Save size={18} />
            Save
          </button>
          <button
            type="button"
            className="icon-button"
            disabled={!selectedItem}
            onClick={() => {
              if (!selectedItem) {
                return
              }
              void deleteFurniture(selectedItem.id)
              setSelectedId(null)
            }}
            aria-label="Delete selected furniture"
          >
            <Trash2 size={19} />
          </button>
          <button
            type="button"
            className={`icon-button ${isMapEditing ? 'is-active' : ''}`}
            onClick={() => {
              setIsMapEditing((current) => !current)
              setSelectedId(null)
            }}
            aria-label={isMapEditing ? 'Close map editor' : 'Edit apartment map'}
            aria-pressed={isMapEditing}
          >
            <Map size={19} />
          </button>
          <details className="dev-menu">
            <summary aria-label="Open settings">
              <Settings2 size={19} />
            </summary>
            <div className="dev-popover">
              <button type="button" onClick={handleReset}>
                Reset furniture
              </button>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.removeItem(NAME_STORAGE_KEY)
                  setUserName(null)
                }}
              >
                <LogOut size={16} />
                Switch name
              </button>
            </div>
          </details>
        </div>
      </header>
      {setupMessage && <div className="error-banner">{setupMessage}</div>}
      {!isSupabaseConfigured && (
        <div className="local-banner">Add Supabase env vars for co-op mode.</div>
      )}
      <main className="workspace">
        <section className="canvas-panel" aria-label="Apartment floor plan">
          {isMapEditing && (
            <div className="map-editor-bar">
              <select
                value={selectedRoomName}
                onChange={(event) => setSelectedRoomName(event.target.value as ZoneName)}
                aria-label="Room to edit"
              >
                {mapDraft.rooms.map((room) => (
                  <option key={room.name} value={room.name}>
                    {room.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => handleScaleMap(0.96)}>
                Map -
              </button>
              <button type="button" onClick={() => handleScaleMap(1.04)}>
                Map +
              </button>
              <button type="button" onClick={() => handleNudgeSelectedRoom(0, -0.5)} aria-label="Move selected room up">
                <ArrowUp size={16} />
              </button>
              <button type="button" onClick={() => handleNudgeSelectedRoom(-0.5, 0)} aria-label="Move selected room left">
                <ArrowLeft size={16} />
              </button>
              <button type="button" onClick={() => handleNudgeSelectedRoom(0.5, 0)} aria-label="Move selected room right">
                <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => handleNudgeSelectedRoom(0, 0.5)} aria-label="Move selected room down">
                <ArrowDown size={16} />
              </button>
              <button type="button" onClick={() => handleResizeSelectedRoom(0.94, 1)}>
                Narrow
              </button>
              <button type="button" onClick={() => handleResizeSelectedRoom(1.06, 1)}>
                Widen
              </button>
              <button type="button" onClick={() => handleResizeSelectedRoom(1, 0.94)}>
                Shorter
              </button>
              <button type="button" onClick={() => handleResizeSelectedRoom(1, 1.06)}>
                Taller
              </button>
              <button type="button" onClick={handleSaveMap}>
                <Save size={16} />
                Map
              </button>
              <button type="button" onClick={() => void handleCopyMap()}>
                <Copy size={16} />
                JSON
              </button>
              <button type="button" onClick={handleResetMap} aria-label="Reset map draft">
                <RotateCcw size={16} />
              </button>
              <span>
                {mapCopyStatus ?? mapSavedLabel}
                {selectedRoom ? ` - ${Math.round(selectedRoom.width / PX_PER_FOOT)}' x ${Math.round(selectedRoom.height / PX_PER_FOOT)}'` : ''}
              </span>
            </div>
          )}
          <ApartmentCanvas
            floorPlanData={mapDraft}
            items={items}
            selectedId={selectedItem?.id ?? null}
            presence={pointers}
            isMapEditing={isMapEditing}
            selectedRoomName={selectedRoomName}
            onSelect={setSelectedId}
            onChange={updateFurniture}
            onSelectRoom={setSelectedRoomName}
            onMoveRoom={handleMoveRoom}
            onPointerWorldMove={updatePointer}
          />
        </section>
        <FurniturePalette onAdd={handleAddFurniture} />
      </main>
    </div>
  )
}

export default App
