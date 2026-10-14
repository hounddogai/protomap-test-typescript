import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedRewardRuleNoticeEngine } from "./capped-reward-rule-notice-engine.js";
import { newCappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

test("CappedRewardRuleNoticeEngine keeps results within bounds", () => {
  const engine = defaultCappedRewardRuleNoticeEngine();
  const item = newCappedRewardRuleNotice("code-852", "label-25");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
