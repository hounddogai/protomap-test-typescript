import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostAllocationReport } from "./post-allocation-report.js";
import { PostAllocation, newPostAllocation } from "./post-allocation.js";

test("PostAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_526_402);
  const items: PostAllocation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPostAllocation(`post-allocation-${index}`, "sample"));
  }
  const report = buildPostAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
