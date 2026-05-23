import { PX_PER_FOOT, zoneCenters, zoneForDefaultDrop } from './floorPlan'
import type { FurnitureItem, UserName } from '../types'

const ft = (value: number) => value * PX_PER_FOOT

export const furnitureCatalog = [
  {
    type: 'couch',
    label: 'Couch',
    color: '#f2a7a3',
    accent: '#ffe1dc',
    width: ft(6),
    height: ft(3),
  },
  {
    type: 'bed',
    label: 'Bed',
    color: '#9fc7f3',
    accent: '#fff6d7',
    width: ft(6),
    height: ft(7),
  },
  {
    type: 'table',
    label: 'Table',
    color: '#d4a373',
    accent: '#fff0d6',
    width: ft(4),
    height: ft(3),
  },
  {
    type: 'chairs',
    label: 'Chairs',
    color: '#f6c56f',
    accent: '#fff7db',
    width: ft(3.6),
    height: ft(3.2),
  },
  {
    type: 'plant',
    label: 'Plant',
    color: '#6fbf8a',
    accent: '#b7e4bd',
    width: ft(2),
    height: ft(2),
  },
  {
    type: 'rug',
    label: 'Rug',
    color: '#b8a4e3',
    accent: '#f4def9',
    width: ft(7),
    height: ft(5),
  },
  {
    type: 'tvStand',
    label: 'TV stand',
    color: '#8a6f5a',
    accent: '#d8c7ad',
    width: ft(5.5),
    height: ft(1.4),
  },
  {
    type: 'desk',
    label: 'Desk',
    color: '#90c5d8',
    accent: '#f8f3dd',
    width: ft(4.6),
    height: ft(2.3),
  },
  {
    type: 'lamp',
    label: 'Lamp',
    color: '#f7d778',
    accent: '#fff4b8',
    width: ft(1.4),
    height: ft(2.2),
  },
  {
    type: 'dresser',
    label: 'Dresser',
    color: '#c9957a',
    accent: '#f2d7c7',
    width: ft(4.5),
    height: ft(2),
  },
  {
    type: 'bookshelf',
    label: 'Bookshelf',
    color: '#af8f6d',
    accent: '#ead6b8',
    width: ft(4),
    height: ft(1.5),
  },
  {
    type: 'toyBox',
    label: 'Toy box',
    color: '#f69ec4',
    accent: '#ffe5f0',
    width: ft(3.2),
    height: ft(2),
  },
  {
    type: 'beanBag',
    label: 'Bean bag',
    color: '#7ac8b8',
    accent: '#d4fff6',
    width: ft(3),
    height: ft(3),
  },
] as const

export type FurnitureType = (typeof furnitureCatalog)[number]['type']

export const furnitureByType = furnitureCatalog.reduce(
  (defs, item) => ({
    ...defs,
    [item.type]: item,
  }),
  {} as Record<FurnitureType, (typeof furnitureCatalog)[number]>,
)

const defaultSpots: Partial<Record<FurnitureType, { x: number; y: number }>> = {
  bed: zoneCenters.Bedroom,
  couch: zoneCenters['Living Room'],
  tvStand: {
    x: zoneCenters['Living Room'].x + ft(6),
    y: zoneCenters['Living Room'].y - ft(3),
  },
  table: zoneCenters['Dining Area'],
  chairs: {
    x: zoneCenters['Dining Area'].x,
    y: zoneCenters['Dining Area'].y + ft(2.8),
  },
  desk: zoneCenters['Secondary Bedroom / Ari Room'],
  beanBag: {
    x: zoneCenters['Secondary Bedroom / Ari Room'].x + ft(3),
    y: zoneCenters['Secondary Bedroom / Ari Room'].y + ft(2.2),
  },
  plant: {
    x: zoneCenters['Living Room'].x - ft(7),
    y: zoneCenters['Living Room'].y - ft(4),
  },
}

export const isFurnitureType = (type: string): type is FurnitureType =>
  furnitureCatalog.some((item) => item.type === type)

export const createFurnitureItem = (
  type: FurnitureType,
  createdBy: UserName,
): FurnitureItem => {
  const definition = furnitureByType[type]
  const base = defaultSpots[type] ?? zoneForDefaultDrop
  const jitter = Math.random() * ft(1.4) - ft(0.7)

  return {
    id: crypto.randomUUID(),
    type,
    x: base.x - definition.width / 2 + jitter,
    y: base.y - definition.height / 2 + jitter,
    rotation: 0,
    width: definition.width,
    height: definition.height,
    createdBy,
    updatedAt: new Date().toISOString(),
  }
}
