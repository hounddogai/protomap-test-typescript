import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveMentionAllocationReport } from "./adaptive-mention-allocation-report.js";
import { AdaptiveMentionAllocation, newAdaptiveMentionAllocation } from "./adaptive-mention-allocation.js";

test("AdaptiveMentionAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_184_753);
  const items: AdaptiveMentionAllocation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newAdaptiveMentionAllocation(`adaptive-mention-allocation-${index}`, "sample"));
  }
  const report = buildAdaptiveMentionAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
