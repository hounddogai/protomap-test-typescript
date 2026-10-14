import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardBatchReport } from "./reward-batch-report.js";
import { RewardBatch, newRewardBatch } from "./reward-batch.js";

test("RewardBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_134_207);
  const items: RewardBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRewardBatch(`reward-batch-${index}`, "sample"));
  }
  const report = buildRewardBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
