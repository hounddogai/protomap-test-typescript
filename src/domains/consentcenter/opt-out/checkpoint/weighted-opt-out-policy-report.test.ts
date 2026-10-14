import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedOptOutPolicyReport } from "./weighted-opt-out-policy-report.js";
import { WeightedOptOutPolicy, newWeightedOptOutPolicy } from "./weighted-opt-out-policy.js";

test("WeightedOptOutPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_056_475);
  const items: WeightedOptOutPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedOptOutPolicy(`weighted-opt-out-policy-${index}`, "sample"));
  }
  const report = buildWeightedOptOutPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
