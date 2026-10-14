import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleDigestEngine } from "./reward-rule-digest-engine.js";
import { newRewardRuleDigest } from "./reward-rule-digest.js";

test("RewardRuleDigestEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleDigestEngine(flags.newRegistry());
  const item = newRewardRuleDigest("code-391", "title-197");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
