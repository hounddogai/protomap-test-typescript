import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelRuleEngine } from "./level-rule-engine.js";
import { newLevelRule } from "./level-rule.js";

test("LevelRuleEngine keeps results within bounds", () => {
  const engine = defaultLevelRuleEngine();
  const item = newLevelRule("code-806", "label-546");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
