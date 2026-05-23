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
  width: ft(50),
  height: ft(35),
  wallColor: '#7a665a',
  innerWallColor: '#a99182',
  openingColor: '#fbf3e8',
  rooms: [
    {
      name: 'Bedroom',
      x: ft(7),
      y: ft(2),
      width: ft(17),
      height: ft(11),
      fill: '#f8e6ea',
      measuredAs: "17' x 11'",
    },
    {
      name: 'Bathroom',
      x: ft(25),
      y: ft(5.5),
      width: ft(6.5),
      height: ft(5.5),
      fill: '#dceef2',
    },
    {
      name: 'Secondary Bedroom / Ari Room',
      x: ft(33),
      y: ft(2),
      width: ft(14),
      height: ft(10),
      fill: '#e8e2fb',
      measuredAs: "14' x 10'",
    },
    {
      name: 'Entry/Hallway',
      x: ft(24),
      y: ft(11),
      width: ft(10),
      height: ft(7),
      fill: '#f6eadb',
    },
    {
      name: 'Living Room',
      x: ft(7),
      y: ft(15),
      width: ft(19),
      height: ft(14),
      fill: '#efe7d8',
      measuredAs: "19' x 14'",
    },
    {
      name: 'Kitchen',
      x: ft(33),
      y: ft(15),
      width: ft(15),
      height: ft(8),
      fill: '#e6ddd2',
    },
    {
      name: 'Dining Area',
      x: ft(39),
      y: ft(24),
      width: ft(9),
      height: ft(8),
      fill: '#f4e7cb',
      measuredAs: "9' x 8'",
    },
    {
      name: 'Balcony/Patio',
      x: ft(1),
      y: ft(19),
      width: ft(6),
      height: ft(13),
      fill: '#dcebd9',
    },
  ] satisfies RoomZone[],
  angledWalls: [
    [ft(34), ft(18), ft(39), ft(15), ft(42), ft(17.8)],
    [ft(34), ft(18), ft(39), ft(24), ft(34), ft(24)],
  ],
  counters: [
    { x: ft(35), y: ft(15.5), width: ft(12), height: ft(1.4) },
    { x: ft(46), y: ft(16.3), width: ft(1.4), height: ft(6.2) },
    { x: ft(35), y: ft(21.2), width: ft(5), height: ft(1.3) },
  ],
  openings: [
    { x1: ft(18), y1: ft(13), x2: ft(21.5), y2: ft(13) },
    { x1: ft(24), y1: ft(15), x2: ft(24), y2: ft(17.8) },
    { x1: ft(31.5), y1: ft(12), x2: ft(34), y2: ft(12) },
    { x1: ft(26), y1: ft(18), x2: ft(29), y2: ft(18) },
    { x1: ft(7), y1: ft(23), x2: ft(7), y2: ft(27) },
    { x1: ft(39), y1: ft(23), x2: ft(42), y2: ft(23) },
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
