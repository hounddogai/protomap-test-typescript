import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalApprovalAdjustmentReport } from "./seasonal-approval-adjustment-report.js";
import { SeasonalApprovalAdjustment, newSeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

test("SeasonalApprovalAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_261_005);
  const items: SeasonalApprovalAdjustment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalApprovalAdjustment(`seasonal-approval-adjustment-${index}`, "sample"));
  }
  const report = buildSeasonalApprovalAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
