import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredPlacementSlotReport } from "./tiered-placement-slot-report.js";
import { TieredPlacementSlot, newTieredPlacementSlot } from "./tiered-placement-slot.js";

test("TieredPlacementSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_922_349);
  const items: TieredPlacementSlot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredPlacementSlot(`tiered-placement-slot-${index}`, "sample"));
  }
  const report = buildTieredPlacementSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
