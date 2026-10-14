import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackSlaAdjustmentReport } from "./fallback-sla-adjustment-report.js";
import { FallbackSlaAdjustment, newFallbackSlaAdjustment } from "./fallback-sla-adjustment.js";

test("FallbackSlaAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_159_711);
  const items: FallbackSlaAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackSlaAdjustment(`fallback-sla-adjustment-${index}`, "sample"));
  }
  const report = buildFallbackSlaAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
