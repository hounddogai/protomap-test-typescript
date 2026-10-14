import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelAdjustmentReport } from "./model-adjustment-report.js";
import { ModelAdjustment, newModelAdjustment } from "./model-adjustment.js";

test("ModelAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_870_465);
  const items: ModelAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newModelAdjustment(`model-adjustment-${index}`, "sample"));
  }
  const report = buildModelAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
