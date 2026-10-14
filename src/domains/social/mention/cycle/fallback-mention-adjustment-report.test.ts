import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackMentionAdjustmentReport } from "./fallback-mention-adjustment-report.js";
import { FallbackMentionAdjustment, newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

test("FallbackMentionAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_011_313);
  const items: FallbackMentionAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackMentionAdjustment(`fallback-mention-adjustment-${index}`, "sample"));
  }
  const report = buildFallbackMentionAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
