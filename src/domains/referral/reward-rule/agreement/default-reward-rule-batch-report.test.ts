import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultRewardRuleBatchReport } from "./default-reward-rule-batch-report.js";
import { DefaultRewardRuleBatch, newDefaultRewardRuleBatch } from "./default-reward-rule-batch.js";

test("DefaultRewardRuleBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_835_797);
  const items: DefaultRewardRuleBatch[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultRewardRuleBatch(`default-reward-rule-batch-${index}`, "sample"));
  }
  const report = buildDefaultRewardRuleBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
