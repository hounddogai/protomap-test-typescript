import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionAdjustmentReport } from "./retention-adjustment-report.js";
import { RetentionAdjustment, newRetentionAdjustment } from "./retention-adjustment.js";

test("RetentionAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_422_750);
  const items: RetentionAdjustment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRetentionAdjustment(`retention-adjustment-${index}`, "sample"));
  }
  const report = buildRetentionAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
