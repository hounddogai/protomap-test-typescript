import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedLevelAdjustmentReport } from "./capped-level-adjustment-report.js";
import { CappedLevelAdjustment, newCappedLevelAdjustment } from "./capped-level-adjustment.js";

test("CappedLevelAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_845_840);
  const items: CappedLevelAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedLevelAdjustment(`capped-level-adjustment-${index}`, "sample"));
  }
  const report = buildCappedLevelAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
