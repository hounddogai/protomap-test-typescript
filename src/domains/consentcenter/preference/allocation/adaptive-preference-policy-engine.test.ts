import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptivePreferencePolicyEngine } from "./adaptive-preference-policy-engine.js";
import { newAdaptivePreferencePolicy } from "./adaptive-preference-policy.js";

test("AdaptivePreferencePolicyEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePreferencePolicyEngine(flags.newRegistry());
  const item = newAdaptivePreferencePolicy("code-373", "title-941");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
