import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackLevelRuleEngine } from "./fallback-level-rule-engine.js";
import { newFallbackLevelRule } from "./fallback-level-rule.js";

test("FallbackLevelRuleEngine keeps results within bounds", () => {
  const engine = defaultFallbackLevelRuleEngine();
  const item = newFallbackLevelRule("code-642", "label-513");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
