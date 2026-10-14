import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInRuleEngine } from "./double-opt-in-rule-engine.js";
import { newDoubleOptInRule } from "./double-opt-in-rule.js";

test("DoubleOptInRuleEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInRuleEngine();
  const item = newDoubleOptInRule("code-128", "name-91");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
