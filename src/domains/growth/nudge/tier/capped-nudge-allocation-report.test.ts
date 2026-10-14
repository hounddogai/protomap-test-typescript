import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedNudgeAllocationReport } from "./capped-nudge-allocation-report.js";
import { CappedNudgeAllocation, newCappedNudgeAllocation } from "./capped-nudge-allocation.js";

test("CappedNudgeAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_141_273);
  const items: CappedNudgeAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedNudgeAllocation(`capped-nudge-allocation-${index}`, "sample"));
  }
  const report = buildCappedNudgeAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
