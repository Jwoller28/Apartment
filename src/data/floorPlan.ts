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
  stroke?: string
  measuredAs?: string
}

export type DoorOpening = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export const floorPlan = {
  width: ft(52),
  height: ft(37),
  wallColor: '#7a665a',
  innerWallColor: '#a99182',
  openingColor: '#fbf3e8',
  rooms: [
    {
      name: 'Balcony/Patio',
      x: ft(1),
      y: ft(1),
      width: ft(15),
      height: ft(10),
      fill: '#dcebd9',
    },
    {
      name: 'Living Room',
      x: ft(6),
      y: ft(11),
      width: ft(20),
      height: ft(14),
      fill: '#efe7d8',
      measuredAs: "19' x 14'",
    },
    {
      name: 'Dining Area',
      x: ft(3),
      y: ft(25),
      width: ft(9),
      height: ft(8),
      fill: '#f4e7cb',
      measuredAs: "9' x 8'",
    },
    {
      name: 'Kitchen',
      x: ft(12),
      y: ft(25),
      width: ft(17),
      height: ft(8),
      fill: '#e6ddd2',
    },
    {
      name: 'Bedroom',
      x: ft(26),
      y: ft(1),
      width: ft(17),
      height: ft(11),
      fill: '#f8e6ea',
      measuredAs: "17' x 11'",
    },
    {
      name: 'Bathroom',
      x: ft(26),
      y: ft(12),
      width: ft(7),
      height: ft(6),
      fill: '#dceef2',
    },
    {
      name: 'Entry/Hallway',
      x: ft(26),
      y: ft(18),
      width: ft(11),
      height: ft(10),
      fill: '#f6eadb',
    },
    {
      name: 'Secondary Bedroom / Ari Room',
      x: ft(37),
      y: ft(20),
      width: ft(14),
      height: ft(10),
      fill: '#e8e2fb',
      measuredAs: "14' x 10'",
    },
  ] satisfies RoomZone[],
  angledWalls: [
    [ft(26), ft(18.5), ft(31), ft(15.8), ft(37), ft(20)],
    [ft(26), ft(24.5), ft(31), ft(28), ft(37), ft(28)],
    [ft(33), ft(18), ft(37), ft(20)],
  ],
  counters: [
    { x: ft(13), y: ft(25.5), width: ft(14.5), height: ft(1.35) },
    { x: ft(27.2), y: ft(26.5), width: ft(1.35), height: ft(5.6) },
    { x: ft(14), y: ft(31.2), width: ft(10.5), height: ft(1.35) },
  ],
  openings: [
    { x1: ft(8), y1: ft(11), x2: ft(14.5), y2: ft(11) },
    { x1: ft(17), y1: ft(25), x2: ft(23), y2: ft(25) },
    { x1: ft(26), y1: ft(21), x2: ft(26), y2: ft(24) },
    { x1: ft(32), y1: ft(12), x2: ft(36), y2: ft(12) },
    { x1: ft(33), y1: ft(15), x2: ft(33), y2: ft(17.5) },
    { x1: ft(37), y1: ft(24), x2: ft(37), y2: ft(27) },
    { x1: ft(31), y1: ft(28), x2: ft(34), y2: ft(28) },
    { x1: ft(12), y1: ft(28), x2: ft(12), y2: ft(31.5) },
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
