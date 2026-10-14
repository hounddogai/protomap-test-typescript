import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionAllocationReport } from "./mention-allocation-report.js";
import { MentionAllocation, newMentionAllocation } from "./mention-allocation.js";

test("MentionAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_073_847);
  const items: MentionAllocation[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newMentionAllocation(`mention-allocation-${index}`, "sample"));
  }
  const report = buildMentionAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
