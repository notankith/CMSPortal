// Utility to generate an evenly spaced schedule between two times
// Times are input as "HH:mm" (24h). If endTime <= startTime, endTime is treated as next day.

export type ContentType = "reel" | "post"

export interface ScheduleItem {
  index: number
  type: ContentType
  time: string // HH:mm
}

function parseHHMM(input: string): number {
  const [h, m] = input.split(":").map((s) => parseInt(s, 10))
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
}

function formatHHMM(totalMinutes: number): string {
  // normalize to 0..1439
  const mins = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

interface GenerateOptions {
  count: number
  startTime: string // HH:mm
  endTime: string // HH:mm
  startWith?: ContentType // default 'reel'
}

/**
 * Generate an array of scheduled times (HH:mm) evenly distributed between start and end (inclusive).
 * Items will alternate types starting with startWith.
 * If count === 1, the single item is scheduled at startTime.
 */
export function generateSchedule({ count, startTime, endTime, startWith = "reel" }: GenerateOptions): ScheduleItem[] {
  const items: ScheduleItem[] = []
  if (count <= 0) return items

  const startMins = parseHHMM(startTime)
  let endMins = parseHHMM(endTime)

  // If end <= start, assume end is next day
  if (endMins <= startMins) {
    endMins += 24 * 60
  }

  if (count === 1) {
    items.push({ index: 1, type: startWith, time: formatHHMM(startMins) })
    return items
  }

  const duration = endMins - startMins
  const step = duration / (count - 1)

  for (let i = 0; i < count; i++) {
    const minutes = startMins + i * step
    const type: ContentType = i % 2 === 0 ? startWith : startWith === "reel" ? "post" : "reel"
    items.push({ index: i + 1, type, time: formatHHMM(minutes) })
  }

  return items
}

export default generateSchedule
