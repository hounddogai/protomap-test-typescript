import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardRuleSnapshotReport } from "./reward-rule-snapshot-report.js";
import { RewardRuleSnapshot, newRewardRuleSnapshot } from "./reward-rule-snapshot.js";

test("RewardRuleSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_572_023);
  const items: RewardRuleSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRewardRuleSnapshot(`reward-rule-snapshot-${index}`, "sample"));
  }
  const report = buildRewardRuleSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
