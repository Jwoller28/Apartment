export const PX_PER_FOOT = 34

const ft = (value: number) => value * PX_PER_FOOT

export type ZoneName =
  | 'Bedroom'
  | 'Bathroom'
  | 'Secondary Bedroom / Ari Room'
  | 'Living Room'
  | 'Kitchen'
  | 'Dining Area'
  | 'Balcony/Patio'
  | 'Entry/Hallway'

export type RoomZone = {
  name: ZoneName
  x: number
  y: number
  width: number
  height: number
  fill: string
  points?: number[]
  stroke?: string
  measuredAs?: string
}

export type DoorOpening = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type CounterShape = {
  x: number
  y: number
  width: number
  height: number
}

export type FloorPlanData = {
  width: number
  height: number
  wallColor: string
  innerWallColor: string
  openingColor: string
  rooms: RoomZone[]
  angledWalls: number[][]
  counters: CounterShape[]
  openings: DoorOpening[]
}

export const floorPlan: FloorPlanData = {
  width: ft(43),
  height: ft(33),
  wallColor: '#7a665a',
  innerWallColor: '#a99182',
  openingColor: '#fbf3e8',
  rooms: [
    {
      name: 'Balcony/Patio',
      x: ft(1),
      y: ft(1),
      width: ft(18),
      height: ft(7),
      fill: '#dcebd9',
    },
    {
      name: 'Living Room',
      x: ft(1),
      y: ft(8),
      width: ft(19),
      height: ft(14),
      points: [
        ft(1),
        ft(8),
        ft(20),
        ft(8),
        ft(20),
        ft(19.7),
        ft(18.2),
        ft(22),
        ft(1),
        ft(22),
      ],
      fill: '#efe7d8',
      measuredAs: "19' x 14'",
    },
    {
      name: 'Dining Area',
      x: ft(1),
      y: ft(23),
      width: ft(9),
      height: ft(8),
      fill: '#f4e7cb',
      measuredAs: "9' x 8'",
    },
    {
      name: 'Kitchen',
      x: ft(10),
      y: ft(23),
      width: ft(17.5),
      height: ft(8),
      fill: '#e6ddd2',
    },
    {
      name: 'Bedroom',
      x: ft(23),
      y: ft(1),
      width: ft(17),
      height: ft(11),
      fill: '#f8e6ea',
      measuredAs: "17' x 11'",
    },
    {
      name: 'Bathroom',
      x: ft(26),
      y: ft(13),
      width: ft(12),
      height: ft(6),
      fill: '#dceef2',
    },
    {
      name: 'Entry/Hallway',
      x: ft(20),
      y: ft(12),
      width: ft(7),
      height: ft(12),
      points: [
        ft(20),
        ft(11.2),
        ft(23),
        ft(12.2),
        ft(23),
        ft(15.6),
        ft(26),
        ft(18.2),
        ft(26),
        ft(24),
        ft(21.5),
        ft(24),
        ft(18.2),
        ft(21.5),
        ft(20),
        ft(19.6),
      ],
      fill: '#f6eadb',
    },
    {
      name: 'Secondary Bedroom / Ari Room',
      x: ft(26),
      y: ft(20),
      width: ft(14),
      height: ft(10),
      fill: '#e8e2fb',
      measuredAs: "14' x 10'",
    },
  ] satisfies RoomZone[],
  angledWalls: [
    [ft(20), ft(19.6), ft(23), ft(15.6), ft(26), ft(18.2)],
    [ft(18.2), ft(21.5), ft(21.5), ft(24), ft(26), ft(24)],
  ],
  counters: [
    { x: ft(11), y: ft(23.55), width: ft(15), height: ft(1.35) },
    { x: ft(25.8), y: ft(24.4), width: ft(1.35), height: ft(5.9) },
    { x: ft(12.5), y: ft(29.75), width: ft(10.4), height: ft(1.35) },
  ],
  openings: [
    { x1: ft(5), y1: ft(8), x2: ft(9), y2: ft(8) },
    { x1: ft(15.2), y1: ft(8), x2: ft(18.5), y2: ft(8) },
    { x1: ft(15.5), y1: ft(22), x2: ft(18), y2: ft(22) },
    { x1: ft(10), y1: ft(25.7), x2: ft(10), y2: ft(28.7) },
    { x1: ft(20), y1: ft(14.5), x2: ft(20), y2: ft(17.2) },
    { x1: ft(23), y1: ft(12), x2: ft(26), y2: ft(12) },
    { x1: ft(29), y1: ft(19), x2: ft(34), y2: ft(19) },
    { x1: ft(26), y1: ft(22.2), x2: ft(26), y2: ft(25.2) },
    { x1: ft(22.5), y1: ft(24), x2: ft(25.2), y2: ft(24) },
  ] satisfies DoorOpening[],
}

export const zoneCenters = floorPlan.rooms.reduce(
  (centers, room) => ({
    ...centers,
    [room.name]: {
      x: room.x + room.width / 2,
      y: room.y + room.height / 2,
    },
  }),
  {} as Record<ZoneName, { x: number; y: number }>,
)

export const zoneForDefaultDrop = zoneCenters['Living Room']
