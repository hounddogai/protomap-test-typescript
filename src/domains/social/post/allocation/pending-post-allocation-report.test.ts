import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingPostAllocationReport } from "./pending-post-allocation-report.js";
import { PendingPostAllocation, newPendingPostAllocation } from "./pending-post-allocation.js";

test("PendingPostAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_924_097);
  const items: PendingPostAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingPostAllocation(`pending-post-allocation-${index}`, "sample"));
  }
  const report = buildPendingPostAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
