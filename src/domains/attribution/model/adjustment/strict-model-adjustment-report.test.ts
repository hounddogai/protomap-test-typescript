import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictModelAdjustmentReport } from "./strict-model-adjustment-report.js";
import { StrictModelAdjustment, newStrictModelAdjustment } from "./strict-model-adjustment.js";

test("StrictModelAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_189_812);
  const items: StrictModelAdjustment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictModelAdjustment(`strict-model-adjustment-${index}`, "sample"));
  }
  const report = buildStrictModelAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
