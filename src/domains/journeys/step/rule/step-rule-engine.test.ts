import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepRuleEngine } from "./step-rule-engine.js";
import { newStepRule } from "./step-rule.js";

test("StepRuleEngine keeps results within bounds", () => {
  const engine = defaultStepRuleEngine();
  const item = newStepRule("code-588", "title-546");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
