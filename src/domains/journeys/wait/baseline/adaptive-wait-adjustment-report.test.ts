import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveWaitAdjustmentReport } from "./adaptive-wait-adjustment-report.js";
import { AdaptiveWaitAdjustment, newAdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

test("AdaptiveWaitAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_285_888);
  const items: AdaptiveWaitAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveWaitAdjustment(`adaptive-wait-adjustment-${index}`, "sample"));
  }
  const report = buildAdaptiveWaitAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
