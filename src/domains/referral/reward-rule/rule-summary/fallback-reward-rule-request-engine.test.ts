import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackRewardRuleRequestEngine } from "./fallback-reward-rule-request-engine.js";
import { newFallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

test("FallbackRewardRuleRequestEngine keeps results within bounds", () => {
  const engine = defaultFallbackRewardRuleRequestEngine();
  const item = newFallbackRewardRuleRequest("code-40", "label-887");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
