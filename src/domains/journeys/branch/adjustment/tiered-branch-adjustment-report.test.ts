import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBranchAdjustmentReport } from "./tiered-branch-adjustment-report.js";
import { TieredBranchAdjustment, newTieredBranchAdjustment } from "./tiered-branch-adjustment.js";

test("TieredBranchAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_438_181);
  const items: TieredBranchAdjustment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredBranchAdjustment(`tiered-branch-adjustment-${index}`, "sample"));
  }
  const report = buildTieredBranchAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
