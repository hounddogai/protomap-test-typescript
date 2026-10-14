import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultOptOutAllocationReport } from "./default-opt-out-allocation-report.js";
import { DefaultOptOutAllocation, newDefaultOptOutAllocation } from "./default-opt-out-allocation.js";

test("DefaultOptOutAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_133_454);
  const items: DefaultOptOutAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultOptOutAllocation(`default-opt-out-allocation-${index}`, "sample"));
  }
  const report = buildDefaultOptOutAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
