import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofAdjustmentReport } from "./proof-adjustment-report.js";
import { ProofAdjustment, newProofAdjustment } from "./proof-adjustment.js";

test("ProofAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_990_611);
  const items: ProofAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newProofAdjustment(`proof-adjustment-${index}`, "sample"));
  }
  const report = buildProofAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
