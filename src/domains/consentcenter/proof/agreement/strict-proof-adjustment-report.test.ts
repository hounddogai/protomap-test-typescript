import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictProofAdjustmentReport } from "./strict-proof-adjustment-report.js";
import { StrictProofAdjustment, newStrictProofAdjustment } from "./strict-proof-adjustment.js";

test("StrictProofAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_713_415);
  const items: StrictProofAdjustment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictProofAdjustment(`strict-proof-adjustment-${index}`, "sample"));
  }
  const report = buildStrictProofAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
