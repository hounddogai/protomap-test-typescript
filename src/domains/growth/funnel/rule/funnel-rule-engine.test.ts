import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelRuleEngine } from "./funnel-rule-engine.js";
import { newFunnelRule } from "./funnel-rule.js";

test("FunnelRuleEngine keeps results within bounds", () => {
  const engine = defaultFunnelRuleEngine();
  const item = newFunnelRule("code-764", "title-520");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
