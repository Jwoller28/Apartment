import {
  Armchair,
  BedDouble,
  BookOpen,
  Box,
  Circle,
  Flower2,
  Lamp,
  Monitor,
  Sofa,
  Square,
  Table2,
} from 'lucide-react'
import type { ComponentType, CSSProperties } from 'react'
import { furnitureCatalog, type FurnitureType } from '../data/furniture'

type FurniturePaletteProps = {
  onAdd: (type: FurnitureType) => void
}

const iconByType: Record<FurnitureType, ComponentType<{ size?: number }>> = {
  couch: Sofa,
  bed: BedDouble,
  table: Table2,
  chairs: Armchair,
  plant: Flower2,
  rug: Square,
  tvStand: Monitor,
  desk: Table2,
  lamp: Lamp,
  dresser: Box,
  bookshelf: BookOpen,
  toyBox: Box,
  beanBag: Circle,
}

export const FurniturePalette = ({ onAdd }: FurniturePaletteProps) => (
  <aside className="furniture-palette" aria-label="Furniture palette">
    {furnitureCatalog.map((item) => {
      const Icon = iconByType[item.type]

      return (
        <button
          key={item.type}
          className="palette-item"
          type="button"
          onClick={() => onAdd(item.type)}
          style={{ '--item-color': item.color } as CSSProperties}
        >
          <span className="palette-icon" aria-hidden="true">
            <Icon size={22} />
          </span>
          <span>{item.label}</span>
        </button>
      )
    })}
  </aside>
)
