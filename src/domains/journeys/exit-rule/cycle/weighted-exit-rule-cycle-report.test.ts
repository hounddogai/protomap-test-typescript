import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedExitRuleCycleReport } from "./weighted-exit-rule-cycle-report.js";
import { WeightedExitRuleCycle, newWeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

test("WeightedExitRuleCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_993_107);
  const items: WeightedExitRuleCycle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedExitRuleCycle(`weighted-exit-rule-cycle-${index}`, "sample"));
  }
  const report = buildWeightedExitRuleCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
