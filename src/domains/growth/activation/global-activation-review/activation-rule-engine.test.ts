import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationRuleEngine } from "./activation-rule-engine.js";
import { newActivationRule } from "./activation-rule.js";

test("ActivationRuleEngine keeps results within bounds", () => {
  const engine = defaultActivationRuleEngine();
  const item = newActivationRule("code-679", "title-800");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
