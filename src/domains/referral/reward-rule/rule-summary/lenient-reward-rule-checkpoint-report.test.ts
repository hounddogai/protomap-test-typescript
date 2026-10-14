import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientRewardRuleCheckpointReport } from "./lenient-reward-rule-checkpoint-report.js";
import { LenientRewardRuleCheckpoint, newLenientRewardRuleCheckpoint } from "./lenient-reward-rule-checkpoint.js";

test("LenientRewardRuleCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_988_845);
  const items: LenientRewardRuleCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientRewardRuleCheckpoint(`lenient-reward-rule-checkpoint-${index}`, "sample"));
  }
  const report = buildLenientRewardRuleCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
