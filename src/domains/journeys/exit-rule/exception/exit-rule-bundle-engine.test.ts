import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleBundleEngine } from "./exit-rule-bundle-engine.js";
import { newExitRuleBundle } from "./exit-rule-bundle.js";

test("ExitRuleBundleEngine keeps results within bounds", () => {
  const engine = defaultExitRuleBundleEngine();
  const item = newExitRuleBundle("code-428", "name-589");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
