import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleTargetEngine } from "./exit-rule-target-engine.js";
import { newExitRuleTarget } from "./exit-rule-target.js";

test("ExitRuleTargetEngine keeps results within bounds", () => {
  const engine = defaultExitRuleTargetEngine();
  const item = newExitRuleTarget("code-694", "name-827");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
