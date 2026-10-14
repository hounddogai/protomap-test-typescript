import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeRuleEngine } from "./challenge-rule-engine.js";
import { newChallengeRule } from "./challenge-rule.js";

test("ChallengeRuleEngine keeps results within bounds", () => {
  const engine = defaultChallengeRuleEngine();
  const item = newChallengeRule("code-939", "label-337");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
