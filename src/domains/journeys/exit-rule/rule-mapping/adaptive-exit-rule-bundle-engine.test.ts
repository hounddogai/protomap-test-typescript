import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveExitRuleBundleEngine } from "./adaptive-exit-rule-bundle-engine.js";
import { newAdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

test("AdaptiveExitRuleBundleEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveExitRuleBundleEngine();
  const item = newAdaptiveExitRuleBundle("code-735", "name-698");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
