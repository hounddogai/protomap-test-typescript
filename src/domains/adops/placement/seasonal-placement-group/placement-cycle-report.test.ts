import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementCycleReport } from "./placement-cycle-report.js";
import { PlacementCycle, newPlacementCycle } from "./placement-cycle.js";

test("PlacementCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_961_301);
  const items: PlacementCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPlacementCycle(`placement-cycle-${index}`, "sample"));
  }
  const report = buildPlacementCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
