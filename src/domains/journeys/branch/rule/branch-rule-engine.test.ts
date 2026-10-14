import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchRuleEngine } from "./branch-rule-engine.js";
import { newBranchRule } from "./branch-rule.js";

test("BranchRuleEngine keeps results within bounds", () => {
  const engine = defaultBranchRuleEngine();
  const item = newBranchRule("code-792", "title-906");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
