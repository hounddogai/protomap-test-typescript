import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleNoticeEngine } from "./reward-rule-notice-engine.js";
import { newRewardRuleNotice } from "./reward-rule-notice.js";

test("RewardRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleNoticeEngine(flags.newRegistry());
  const item = newRewardRuleNotice("code-153", "name-490");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
