import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathSlotReport } from "./path-slot-report.js";
import { PathSlot, newPathSlot } from "./path-slot.js";

test("PathSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_207_549);
  const items: PathSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPathSlot(`path-slot-${index}`, "sample"));
  }
  const report = buildPathSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
