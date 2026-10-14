import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleSnapshotEngine } from "./reward-rule-snapshot-engine.js";
import { newRewardRuleSnapshot } from "./reward-rule-snapshot.js";

test("RewardRuleSnapshotEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleSnapshotEngine(flags.newRegistry());
  const item = newRewardRuleSnapshot("code-63", "label-291");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
