import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeAllocationReport } from "./badge-allocation-report.js";
import { BadgeAllocation, newBadgeAllocation } from "./badge-allocation.js";

test("BadgeAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_840_123);
  const items: BadgeAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBadgeAllocation(`badge-allocation-${index}`, "sample"));
  }
  const report = buildBadgeAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
