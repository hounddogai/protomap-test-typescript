import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingAllocationReport } from "./pacing-allocation-report.js";
import { PacingAllocation, newPacingAllocation } from "./pacing-allocation.js";

test("PacingAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_574_517);
  const items: PacingAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPacingAllocation(`pacing-allocation-${index}`, "sample"));
  }
  const report = buildPacingAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
