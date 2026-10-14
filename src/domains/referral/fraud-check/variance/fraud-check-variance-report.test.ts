import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckVarianceReport } from "./fraud-check-variance-report.js";
import { FraudCheckVariance, newFraudCheckVariance } from "./fraud-check-variance.js";

test("FraudCheckVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_784_613);
  const items: FraudCheckVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFraudCheckVariance(`fraud-check-variance-${index}`, "sample"));
  }
  const report = buildFraudCheckVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
