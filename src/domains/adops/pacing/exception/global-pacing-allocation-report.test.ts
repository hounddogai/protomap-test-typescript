import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalPacingAllocationReport } from "./global-pacing-allocation-report.js";
import { GlobalPacingAllocation, newGlobalPacingAllocation } from "./global-pacing-allocation.js";

test("GlobalPacingAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_752_013);
  const items: GlobalPacingAllocation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalPacingAllocation(`global-pacing-allocation-${index}`, "sample"));
  }
  const report = buildGlobalPacingAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
