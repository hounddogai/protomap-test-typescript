import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientReputationRuleEngine } from "./lenient-reputation-rule-engine.js";
import { newLenientReputationRule } from "./lenient-reputation-rule.js";

test("LenientReputationRuleEngine keeps results within bounds", () => {
  const engine = defaultLenientReputationRuleEngine();
  const item = newLenientReputationRule("code-544", "label-960");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
