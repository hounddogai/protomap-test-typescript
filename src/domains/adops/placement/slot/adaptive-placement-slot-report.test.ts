import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptivePlacementSlotReport } from "./adaptive-placement-slot-report.js";
import { AdaptivePlacementSlot, newAdaptivePlacementSlot } from "./adaptive-placement-slot.js";

test("AdaptivePlacementSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_054_225);
  const items: AdaptivePlacementSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newAdaptivePlacementSlot(`adaptive-placement-slot-${index}`, "sample"));
  }
  const report = buildAdaptivePlacementSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
