import type { FurnitureType } from './data/furniture'

export type UserName = 'Jordan' | 'Camila' | 'Ari'

export type SyncState = 'local' | 'connecting' | 'connected' | 'saving' | 'error'

export type Point = {
  x: number
  y: number
}

export type FurnitureItem = {
  id: string
  type: FurnitureType
  x: number
  y: number
  rotation: number
  width: number
  height: number
  createdBy: UserName | string
  updatedAt: string
}

export type PresencePointer = Point & {
  name: UserName
  color: string
  seenAt: number
}
