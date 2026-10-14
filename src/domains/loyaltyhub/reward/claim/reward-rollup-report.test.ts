import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRollupReport } from "./reward-rollup-report.js";
import { RewardRollup, newRewardRollup } from "./reward-rollup.js";

test("RewardRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_567_613);
  const items: RewardRollup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRewardRollup(`reward-rollup-${index}`, "sample"));
  }
  const report = buildRewardRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
