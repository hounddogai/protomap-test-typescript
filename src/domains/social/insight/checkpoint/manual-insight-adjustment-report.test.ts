import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualInsightAdjustmentReport } from "./manual-insight-adjustment-report.js";
import { ManualInsightAdjustment, newManualInsightAdjustment } from "./manual-insight-adjustment.js";

test("ManualInsightAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_072_918);
  const items: ManualInsightAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualInsightAdjustment(`manual-insight-adjustment-${index}`, "sample"));
  }
  const report = buildManualInsightAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
