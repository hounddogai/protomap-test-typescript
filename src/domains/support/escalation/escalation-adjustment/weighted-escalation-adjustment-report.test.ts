import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedEscalationAdjustmentReport } from "./weighted-escalation-adjustment-report.js";
import { WeightedEscalationAdjustment, newWeightedEscalationAdjustment } from "./weighted-escalation-adjustment.js";

test("WeightedEscalationAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_088_935);
  const items: WeightedEscalationAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedEscalationAdjustment(`weighted-escalation-adjustment-${index}`, "sample"));
  }
  const report = buildWeightedEscalationAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
