import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckRollupReport } from "./fraud-check-rollup-report.js";
import { FraudCheckRollup, newFraudCheckRollup } from "./fraud-check-rollup.js";

test("FraudCheckRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_898_581);
  const items: FraudCheckRollup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFraudCheckRollup(`fraud-check-rollup-${index}`, "sample"));
  }
  const report = buildFraudCheckRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
