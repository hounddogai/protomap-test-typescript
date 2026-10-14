import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchAllocationReport } from "./branch-allocation-report.js";
import { BranchAllocation, newBranchAllocation } from "./branch-allocation.js";

test("BranchAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_293_519);
  const items: BranchAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBranchAllocation(`branch-allocation-${index}`, "sample"));
  }
  const report = buildBranchAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
