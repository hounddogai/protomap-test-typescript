import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathAllocationReport } from "./path-allocation-report.js";
import { PathAllocation, newPathAllocation } from "./path-allocation.js";

test("PathAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_191_168);
  const items: PathAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPathAllocation(`path-allocation-${index}`, "sample"));
  }
  const report = buildPathAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
