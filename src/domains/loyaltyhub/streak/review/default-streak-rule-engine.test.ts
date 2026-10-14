import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultStreakRuleEngine } from "./default-streak-rule-engine.js";
import { newDefaultStreakRule } from "./default-streak-rule.js";

test("DefaultStreakRuleEngine keeps results within bounds", () => {
  const engine = defaultDefaultStreakRuleEngine();
  const item = newDefaultStreakRule("code-527", "label-620");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
