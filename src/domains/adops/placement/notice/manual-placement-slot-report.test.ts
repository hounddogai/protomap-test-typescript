import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPlacementSlotReport } from "./manual-placement-slot-report.js";
import { ManualPlacementSlot, newManualPlacementSlot } from "./manual-placement-slot.js";

test("ManualPlacementSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_240_793);
  const items: ManualPlacementSlot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualPlacementSlot(`manual-placement-slot-${index}`, "sample"));
  }
  const report = buildManualPlacementSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
