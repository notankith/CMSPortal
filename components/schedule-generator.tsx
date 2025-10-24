"use client"

import React, { useState } from "react"
import generateSchedule, { ScheduleItem } from "@/lib/scheduler"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ScheduleGenerator() {
  const [count, setCount] = useState(10)
  const [startTime, setStartTime] = useState("00:00")
  const [endTime, setEndTime] = useState("06:00")
  const [items, setItems] = useState<ScheduleItem[] | null>(null)

  const handleGenerate = () => {
    if (count <= 0) return
    const schedule = generateSchedule({ count, startTime, endTime, startWith: "reel" })
    setItems(schedule)
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <h3 className="text-lg font-medium text-white mb-3">Schedule Generator</h3>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Pieces</label>
          <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Start (HH:mm)</label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">End (HH:mm)</label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button onClick={handleGenerate}>Generate</Button>
      </div>

      {items && (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.index} className="flex justify-between items-center bg-slate-700/50 p-2 rounded">
              <div>
                <div className="text-sm text-slate-200 font-medium">{it.type === "reel" ? `Reel ${Math.ceil(it.index / 2)}` : `Post ${Math.ceil(it.index / 2)}`}</div>
                <div className="text-xs text-slate-400">Item #{it.index}</div>
              </div>
              <div className="text-sm text-slate-100">{it.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduleGenerator
