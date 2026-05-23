import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { Maximize2, Minus, Plus } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  Circle,
  Ellipse,
  Group,
  Layer,
  Line,
  Rect,
  RegularPolygon,
  Stage,
  Text,
} from 'react-konva'
import { floorPlan, PX_PER_FOOT, zoneCenters } from '../data/floorPlan'
import { furnitureByType } from '../data/furniture'
import { getUserColor } from '../hooks/usePresence'
import type { FurnitureItem, Point, PresencePointer, UserName } from '../types'

type UpdateOptions = {
  live?: boolean
  persist?: boolean
}

type ApartmentCanvasProps = {
  items: FurnitureItem[]
  selectedId: string | null
  presence: PresencePointer[]
  onSelect: (id: string | null) => void
  onChange: (
    id: string,
    patch: Partial<FurnitureItem>,
    options?: UpdateOptions,
  ) => void
  onPointerWorldMove: (point: Point) => void
}

type AvatarState = {
  name: UserName
  x: number
  y: number
  targetX: number
  targetY: number
}

const wallWidth = 8
const minScale = 0.16
const maxScale = 1.6

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const stagePointToWorld = (
  point: Point,
  stagePosition: Point,
  stageScale: number,
): Point => ({
  x: (point.x - stagePosition.x) / stageScale,
  y: (point.y - stagePosition.y) / stageScale,
})

const randomNear = (point: Point, radius = PX_PER_FOOT * 3): Point => ({
  x: point.x + Math.random() * radius - radius / 2,
  y: point.y + Math.random() * radius - radius / 2,
})

const makeAvatar = (name: UserName, zone: keyof typeof zoneCenters) => {
  const start = randomNear(zoneCenters[zone])
  const target = randomNear(zoneCenters['Living Room'])

  return {
    name,
    x: start.x,
    y: start.y,
    targetX: target.x,
    targetY: target.y,
  }
}

const initialAvatars: AvatarState[] = [
  makeAvatar('Jordan', 'Living Room'),
  makeAvatar('Camila', 'Dining Area'),
  makeAvatar('Ari', 'Secondary Bedroom / Ari Room'),
]

const FurnitureGraphic = ({
  item,
  isSelected,
  onSelect,
  onChange,
  onDragActiveChange,
}: {
  item: FurnitureItem
  isSelected: boolean
  onSelect: (id: string) => void
  onChange: ApartmentCanvasProps['onChange']
  onDragActiveChange: (isActive: boolean) => void
}) => {
  const definition = furnitureByType[item.type]

  return (
    <Group
      x={item.x}
      y={item.y}
      rotation={item.rotation}
      draggable
      onMouseDown={(event) => {
        event.cancelBubble = true
        onSelect(item.id)
      }}
      onTap={(event) => {
        event.cancelBubble = true
        onSelect(item.id)
      }}
      onDragStart={(event) => {
        event.cancelBubble = true
        onSelect(item.id)
        onDragActiveChange(true)
      }}
      onDragMove={(event) => {
        event.cancelBubble = true
        onChange(
          item.id,
          {
            x: event.target.x(),
            y: event.target.y(),
          },
          { live: true },
        )
      }}
      onDragEnd={(event) => {
        event.cancelBubble = true
        onChange(item.id, {
          x: event.target.x(),
          y: event.target.y(),
        })
        onDragActiveChange(false)
      }}
    >
      {isSelected && (
        <Rect
          x={-7}
          y={-7}
          width={item.width + 14}
          height={item.height + 14}
          cornerRadius={12}
          stroke="#ff7a90"
          strokeWidth={3}
          dash={[8, 6]}
        />
      )}
      {renderFurniture(item, definition.color, definition.accent)}
    </Group>
  )
}

const renderFurniture = (
  item: FurnitureItem,
  color: string,
  accent: string,
): ReactNode => {
  const { width, height } = item
  const stroke = '#6c5b51'

  switch (item.type) {
    case 'couch':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={16}
          />
          <Rect
            x={8}
            y={7}
            width={width * 0.38}
            height={height - 14}
            fill={accent}
            cornerRadius={10}
          />
          <Rect
            x={width * 0.52}
            y={7}
            width={width * 0.38}
            height={height - 14}
            fill={accent}
            cornerRadius={10}
          />
          <Rect x={0} y={0} width={12} height={height} fill="#e58f8d" />
          <Rect
            x={width - 12}
            y={0}
            width={12}
            height={height}
            fill="#e58f8d"
          />
        </>
      )
    case 'bed':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fill="#f7f0df"
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={12}
          />
          <Rect
            x={8}
            y={8}
            width={width - 16}
            height={height * 0.22}
            fill={accent}
            cornerRadius={8}
          />
          <Rect
            x={8}
            y={height * 0.38}
            width={width - 16}
            height={height * 0.54}
            fill={color}
            cornerRadius={12}
          />
          <Line
            points={[width * 0.5, height * 0.4, width * 0.5, height * 0.9]}
            stroke="#ffffff"
            strokeWidth={3}
            opacity={0.7}
          />
        </>
      )
    case 'table':
      return (
        <>
          <Ellipse
            x={width / 2}
            y={height / 2}
            radiusX={width / 2}
            radiusY={height / 2}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
          />
          <Ellipse
            x={width / 2}
            y={height / 2}
            radiusX={width / 3}
            radiusY={height / 3}
            fill={accent}
            opacity={0.45}
          />
        </>
      )
    case 'chairs':
      return (
        <>
          {[0, 1, 2, 3].map((index) => {
            const x = index % 2 === 0 ? 0 : width - 34
            const y = index < 2 ? 0 : height - 34

            return (
              <Rect
                key={index}
                x={x}
                y={y}
                width={34}
                height={34}
                fill={color}
                stroke={stroke}
                strokeWidth={2}
                cornerRadius={10}
              />
            )
          })}
          <Rect
            x={width * 0.26}
            y={height * 0.26}
            width={width * 0.48}
            height={height * 0.48}
            fill={accent}
            stroke={stroke}
            strokeWidth={2}
            cornerRadius={10}
          />
        </>
      )
    case 'plant':
      return (
        <>
          <Circle x={width * 0.5} y={height * 0.35} radius={height * 0.28} fill={accent} />
          <Circle x={width * 0.35} y={height * 0.5} radius={height * 0.2} fill={color} />
          <Circle x={width * 0.65} y={height * 0.5} radius={height * 0.2} fill={color} />
          <Rect
            x={width * 0.28}
            y={height * 0.62}
            width={width * 0.44}
            height={height * 0.28}
            fill="#c98b63"
            stroke={stroke}
            strokeWidth={2}
            cornerRadius={6}
          />
        </>
      )
    case 'rug':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fill={color}
            stroke={stroke}
            strokeWidth={2}
            cornerRadius={20}
            opacity={0.88}
          />
          {[0.25, 0.5, 0.75].map((x) => (
            <Line
              key={x}
              points={[width * x, 10, width * x, height - 10]}
              stroke={accent}
              strokeWidth={4}
              opacity={0.65}
            />
          ))}
        </>
      )
    case 'tvStand':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={8}
          />
          <Rect
            x={width * 0.1}
            y={height * 0.22}
            width={width * 0.8}
            height={height * 0.28}
            fill="#2f3542"
            cornerRadius={4}
          />
          <Line
            points={[width * 0.2, height * 0.75, width * 0.8, height * 0.75]}
            stroke={accent}
            strokeWidth={3}
          />
        </>
      )
    case 'desk':
      return (
        <>
          <Rect
            width={width}
            height={height * 0.68}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={8}
          />
          <Rect
            x={width * 0.62}
            y={height * 0.16}
            width={width * 0.28}
            height={height * 0.28}
            fill={accent}
            cornerRadius={4}
          />
          <Rect
            x={width * 0.3}
            y={height * 0.74}
            width={width * 0.4}
            height={height * 0.24}
            fill="#f0c57d"
            stroke={stroke}
            strokeWidth={2}
            cornerRadius={8}
          />
        </>
      )
    case 'lamp':
      return (
        <>
          <Circle x={width / 2} y={height * 0.82} radius={width * 0.34} fill={color} />
          <Line
            points={[width / 2, height * 0.28, width / 2, height * 0.78]}
            stroke={stroke}
            strokeWidth={4}
          />
          <RegularPolygon
            x={width / 2}
            y={height * 0.25}
            sides={3}
            radius={width * 0.48}
            fill={accent}
            stroke={stroke}
            strokeWidth={2}
            rotation={180}
          />
        </>
      )
    case 'dresser':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={8}
          />
          {[0.32, 0.62].map((y) => (
            <Line
              key={y}
              points={[10, height * y, width - 10, height * y]}
              stroke={accent}
              strokeWidth={3}
            />
          ))}
          {[0.28, 0.72].map((x) => (
            <Circle key={x} x={width * x} y={height * 0.48} radius={4} fill={accent} />
          ))}
        </>
      )
    case 'bookshelf':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={6}
          />
          {[0.33, 0.66].map((x) => (
            <Line
              key={x}
              points={[width * x, 4, width * x, height - 4]}
              stroke={accent}
              strokeWidth={3}
            />
          ))}
          {[0.16, 0.48, 0.82].map((x) => (
            <Rect
              key={x}
              x={width * x - 8}
              y={height * 0.2}
              width={10}
              height={height * 0.58}
              fill="#fff5d6"
              cornerRadius={3}
            />
          ))}
        </>
      )
    case 'toyBox':
      return (
        <>
          <Rect
            width={width}
            height={height}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
            cornerRadius={10}
          />
          <Line
            points={[6, height * 0.3, width - 6, height * 0.3]}
            stroke={accent}
            strokeWidth={4}
          />
          <RegularPolygon
            x={width * 0.34}
            y={height * 0.65}
            sides={5}
            radius={9}
            fill={accent}
          />
          <Circle x={width * 0.67} y={height * 0.64} radius={9} fill={accent} />
        </>
      )
    case 'beanBag':
      return (
        <>
          <Ellipse
            x={width / 2}
            y={height / 2}
            radiusX={width * 0.5}
            radiusY={height * 0.42}
            fill={color}
            stroke={stroke}
            strokeWidth={3}
            rotation={-12}
          />
          <Ellipse
            x={width * 0.58}
            y={height * 0.42}
            radiusX={width * 0.18}
            radiusY={height * 0.12}
            fill={accent}
            opacity={0.65}
          />
        </>
      )
    default:
      return null
  }
}

export const ApartmentCanvas = ({
  items,
  selectedId,
  presence,
  onSelect,
  onChange,
  onPointerWorldMove,
}: ApartmentCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [stageScale, setStageScale] = useState(0.55)
  const [stagePosition, setStagePosition] = useState<Point>({ x: 20, y: 20 })
  const [avatars, setAvatars] = useState<AvatarState[]>(initialAvatars)
  const [isFurnitureDragging, setIsFurnitureDragging] = useState(false)
  const didFit = useRef(false)
  const stageScaleRef = useRef(stageScale)
  const stagePositionRef = useRef(stagePosition)
  const lastTouchDistance = useRef<number | null>(null)

  useEffect(() => {
    stageScaleRef.current = stageScale
  }, [stageScale])

  useEffect(() => {
    stagePositionRef.current = stagePosition
  }, [stagePosition])

  useEffect(() => {
    const node = containerRef.current

    if (!node) {
      return
    }

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const fitToScreen = useCallback(() => {
    if (size.width === 0 || size.height === 0) {
      return
    }

    const padding = 28
    const nextScale = clamp(
      Math.min(
        (size.width - padding) / floorPlan.width,
        (size.height - padding) / floorPlan.height,
      ),
      minScale,
      1,
    )

    setStageScale(nextScale)
    setStagePosition({
      x: (size.width - floorPlan.width * nextScale) / 2,
      y: (size.height - floorPlan.height * nextScale) / 2,
    })
  }, [size.height, size.width])

  useEffect(() => {
    if (!didFit.current && size.width && size.height) {
      didFit.current = true
      fitToScreen()
    }
  }, [fitToScreen, size.height, size.width])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAvatars((current) =>
        current.map((avatar) => {
          const dx = avatar.targetX - avatar.x
          const dy = avatar.targetY - avatar.y
          const distance = Math.hypot(dx, dy)

          if (distance < 9) {
            const zones = [
              'Bedroom',
              'Secondary Bedroom / Ari Room',
              'Living Room',
              'Kitchen',
              'Dining Area',
            ] as const
            const nextTarget = randomNear(
              zoneCenters[zones[Math.floor(Math.random() * zones.length)]],
            )

            return {
              ...avatar,
              targetX: nextTarget.x,
              targetY: nextTarget.y,
            }
          }

          return {
            ...avatar,
            x: avatar.x + (dx / distance) * 5,
            y: avatar.y + (dy / distance) * 5,
          }
        }),
      )
    }, 180)

    return () => window.clearInterval(timer)
  }, [])

  const updatePointerFromStage = useCallback(() => {
    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()

    if (!pointer) {
      return
    }

    onPointerWorldMove(
      stagePointToWorld(pointer, stagePositionRef.current, stageScaleRef.current),
    )
  }, [onPointerWorldMove])

  const zoomAtPoint = useCallback((screenPoint: Point, factor: number) => {
    const oldScale = stageScaleRef.current
    const nextScale = clamp(oldScale * factor, minScale, maxScale)
    const oldPosition = stagePositionRef.current
    const worldPoint = stagePointToWorld(screenPoint, oldPosition, oldScale)

    setStageScale(nextScale)
    setStagePosition({
      x: screenPoint.x - worldPoint.x * nextScale,
      y: screenPoint.y - worldPoint.y * nextScale,
    })
  }, [])

  const zoomFromCenter = useCallback(
    (factor: number) => {
      zoomAtPoint({ x: size.width / 2, y: size.height / 2 }, factor)
    },
    [size.height, size.width, zoomAtPoint],
  )

  const handleWheel = useCallback(
    (event: KonvaEventObject<WheelEvent>) => {
      event.evt.preventDefault()

      const pointer = stageRef.current?.getPointerPosition()
      if (!pointer) {
        return
      }

      zoomAtPoint(pointer, event.evt.deltaY > 0 ? 0.92 : 1.08)
    },
    [zoomAtPoint],
  )

  const handleTouchMove = useCallback(
    (event: KonvaEventObject<TouchEvent>) => {
      const touches = event.evt.touches

      if (touches.length === 2) {
        event.evt.preventDefault()

        const first = touches[0]
        const second = touches[1]
        const distance = Math.hypot(
          first.clientX - second.clientX,
          first.clientY - second.clientY,
        )
        const center = {
          x: (first.clientX + second.clientX) / 2,
          y: (first.clientY + second.clientY) / 2,
        }

        if (lastTouchDistance.current) {
          zoomAtPoint(center, distance / lastTouchDistance.current)
        }

        lastTouchDistance.current = distance
        return
      }

      lastTouchDistance.current = null
      updatePointerFromStage()
    },
    [updatePointerFromStage, zoomAtPoint],
  )

  const handlePointerDown = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (event.target === event.target.getStage()) {
        onSelect(null)
      }

      updatePointerFromStage()
    },
    [onSelect, updatePointerFromStage],
  )

  const roomNodes = useMemo(
    () =>
      floorPlan.rooms.map((room) => (
        <Rect
          key={room.name}
          x={room.x}
          y={room.y}
          width={room.width}
          height={room.height}
          fill={room.fill}
          stroke={floorPlan.wallColor}
          strokeWidth={wallWidth}
          cornerRadius={8}
          shadowColor="#d1bca5"
          shadowBlur={5}
          shadowOpacity={0.22}
        />
      )),
    [],
  )

  return (
    <div className="canvas-wrap" ref={containerRef}>
      {size.width > 0 && size.height > 0 && (
        <Stage
          ref={stageRef}
          className="konva-stage"
          width={size.width}
          height={size.height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={!isFurnitureDragging}
          onDragEnd={(event) => {
            if (event.target !== event.target.getStage()) {
              return
            }

            setStagePosition({ x: event.target.x(), y: event.target.y() })
          }}
          onWheel={handleWheel}
          onMouseMove={updatePointerFromStage}
          onTouchMove={handleTouchMove}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
        >
          <Layer>
            <Rect
              x={-PX_PER_FOOT}
              y={-PX_PER_FOOT}
              width={floorPlan.width + PX_PER_FOOT * 2}
              height={floorPlan.height + PX_PER_FOOT * 2}
              fill="#fbf3e8"
              name="floor-background"
            />
            {roomNodes}
            {floorPlan.angledWalls.map((points, index) => (
              <Line
                key={index}
                points={points}
                stroke={floorPlan.wallColor}
                strokeWidth={wallWidth}
                lineCap="round"
                lineJoin="round"
              />
            ))}
            {floorPlan.openings.map((opening, index) => (
              <Line
                key={index}
                points={[opening.x1, opening.y1, opening.x2, opening.y2]}
                stroke={floorPlan.openingColor}
                strokeWidth={wallWidth + 4}
                lineCap="round"
              />
            ))}
            {floorPlan.counters.map((counter, index) => (
              <Rect
                key={index}
                x={counter.x}
                y={counter.y}
                width={counter.width}
                height={counter.height}
                fill="#c3a793"
                stroke="#806b5e"
                strokeWidth={2}
                cornerRadius={6}
              />
            ))}
            <Rect
              x={floorPlan.rooms[6].x + PX_PER_FOOT * 0.8}
              y={floorPlan.rooms[6].y + PX_PER_FOOT * 1.4}
              width={PX_PER_FOOT * 3.2}
              height={PX_PER_FOOT * 2.2}
              fill="#fff7e6"
              stroke="#8c725f"
              strokeWidth={2}
              cornerRadius={8}
            />
            <Circle
              x={floorPlan.rooms[1].x + PX_PER_FOOT * 2}
              y={floorPlan.rooms[1].y + PX_PER_FOOT * 3.7}
              radius={PX_PER_FOOT * 0.55}
              fill="#f9fbff"
              stroke="#86a8b2"
              strokeWidth={2}
            />
            <Rect
              x={floorPlan.rooms[1].x + PX_PER_FOOT * 4}
              y={floorPlan.rooms[1].y + PX_PER_FOOT * 0.7}
              width={PX_PER_FOOT * 1.5}
              height={PX_PER_FOOT * 2.9}
              fill="#f9fbff"
              stroke="#86a8b2"
              strokeWidth={2}
              cornerRadius={6}
            />
            {floorPlan.rooms[7] && (
              <Group>
                {[0, 1, 2, 3, 4].map((line) => (
                  <Line
                    key={line}
                    points={[
                      floorPlan.rooms[7].x + PX_PER_FOOT * 0.8,
                      floorPlan.rooms[7].y + PX_PER_FOOT * (1.3 + line * 2),
                      floorPlan.rooms[7].x +
                        floorPlan.rooms[7].width -
                        PX_PER_FOOT * 0.8,
                      floorPlan.rooms[7].y + PX_PER_FOOT * (1.3 + line * 2),
                    ]}
                    stroke="#b9d1b4"
                    strokeWidth={2}
                  />
                ))}
              </Group>
            )}
            {items.map((item) => (
              <FurnitureGraphic
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={onSelect}
                onChange={onChange}
                onDragActiveChange={setIsFurnitureDragging}
              />
            ))}
            {avatars.map((avatar) => (
              <Group key={avatar.name} x={avatar.x} y={avatar.y}>
                <Circle
                  radius={12 / stageScale}
                  fill={getUserColor(avatar.name)}
                  stroke="#ffffff"
                  strokeWidth={2 / stageScale}
                />
                <Text
                  text={avatar.name.slice(0, 1)}
                  width={24 / stageScale}
                  offsetX={12 / stageScale}
                  offsetY={5 / stageScale}
                  align="center"
                  fontSize={12 / stageScale}
                  fontStyle="bold"
                  fill="#ffffff"
                />
              </Group>
            ))}
            {presence.map((pointer, index) => (
              <Text
                key={`${pointer.name}-${index}`}
                x={pointer.x + 12 / stageScale}
                y={pointer.y - 22 / stageScale}
                text={pointer.name}
                fontSize={15 / stageScale}
                fontStyle="bold"
                fill={pointer.color}
                listening={false}
              />
            ))}
          </Layer>
        </Stage>
      )}
      <div className="zoom-controls" aria-label="Canvas zoom controls">
        <button type="button" onClick={() => zoomFromCenter(1.14)} aria-label="Zoom in">
          <Plus size={20} />
        </button>
        <button type="button" onClick={() => zoomFromCenter(0.88)} aria-label="Zoom out">
          <Minus size={20} />
        </button>
        <button type="button" onClick={fitToScreen} aria-label="Fit apartment">
          <Maximize2 size={19} />
        </button>
      </div>
    </div>
  )
}
