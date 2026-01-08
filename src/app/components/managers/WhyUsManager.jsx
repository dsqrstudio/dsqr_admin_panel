// admin/components/managers/WhyUsManager.jsx
"use client";
import React, { useState } from "react";

const DEFAULT_STATS = [
  { value: "11,000+", label: "Videos Edited" },
  { value: "54k+", label: "Client Time Saved" },
  { value: "22M+", label: "Organic Views Generated" },
  { value: "4h/Day", label: "Time Saved Per Client" },
];

export default function WhyUsManager() {
  const [stats, setStats] = useState(DEFAULT_STATS);

  function update(index, key, value) {
    setStats((s) => s.map((st, i) => (i === index ? { ...st, [key]: value } : st)));
  }

  function save() {
    console.log("save why us", stats);
    alert("Saved");
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Why Us</h2>
        <button onClick={save} className="rounded bg-[#cff000] px-3 py-1 font-semibold">Save</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-lg border bg-white p-4 text-center">
            <input value={s.value} onChange={(e) => update(i, "value", e.target.value)} className="mx-auto mb-2 w-32 rounded border px-2 py-1 text-center text-lg font-semibold" />
            <input value={s.label} onChange={(e) => update(i, "label", e.target.value)} className="mx-auto w-full rounded border px-2 py-1 text-center text-sm text-gray-600" />
          </div>
        ))}
      </div>
    </div>
  );
}
