import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedRewardRuleBatchReport } from "./capped-reward-rule-batch-report.js";
import { CappedRewardRuleBatch, newCappedRewardRuleBatch } from "./capped-reward-rule-batch.js";

test("CappedRewardRuleBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_892_220);
  const items: CappedRewardRuleBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedRewardRuleBatch(`capped-reward-rule-batch-${index}`, "sample"));
  }
  const report = buildCappedRewardRuleBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
