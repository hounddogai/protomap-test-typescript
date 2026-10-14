import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowAllocationReport } from "./window-allocation-report.js";
import { WindowAllocation, newWindowAllocation } from "./window-allocation.js";

test("WindowAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_111_457);
  const items: WindowAllocation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWindowAllocation(`window-allocation-${index}`, "sample"));
  }
  const report = buildWindowAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
