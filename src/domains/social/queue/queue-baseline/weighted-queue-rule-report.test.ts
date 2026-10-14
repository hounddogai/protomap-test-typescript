import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedQueueRuleReport } from "./weighted-queue-rule-report.js";
import { WeightedQueueRule, newWeightedQueueRule } from "./weighted-queue-rule.js";

test("WeightedQueueRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_580_288);
  const items: WeightedQueueRule[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedQueueRule(`weighted-queue-rule-${index}`, "sample"));
  }
  const report = buildWeightedQueueRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
