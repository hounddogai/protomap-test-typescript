import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeAllocationReport } from "./nudge-allocation-report.js";
import { NudgeAllocation, newNudgeAllocation } from "./nudge-allocation.js";

test("NudgeAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_332_419);
  const items: NudgeAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newNudgeAllocation(`nudge-allocation-${index}`, "sample"));
  }
  const report = buildNudgeAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
