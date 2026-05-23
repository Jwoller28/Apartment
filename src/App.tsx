import {
  LogOut,
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
import type { UserName } from './types'

const NAME_STORAGE_KEY = 'cozy-apartment-user'
const users: UserName[] = ['Jordan', 'Camila', 'Ari']

const getStoredUser = (): UserName | null => {
  const stored = window.localStorage.getItem(NAME_STORAGE_KEY)

  return users.includes(stored as UserName) ? (stored as UserName) : null
}

function App() {
  const [userName, setUserName] = useState<UserName | null>(() => getStoredUser())
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return 'Not saved yet'
    }

    return `Saved ${new Date(lastSavedAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })}`
  }, [lastSavedAt])

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
          <ApartmentCanvas
            items={items}
            selectedId={selectedItem?.id ?? null}
            presence={pointers}
            onSelect={setSelectedId}
            onChange={updateFurniture}
            onPointerWorldMove={updatePointer}
          />
        </section>
        <FurniturePalette onAdd={addFurniture} />
      </main>
    </div>
  )
}

export default App
