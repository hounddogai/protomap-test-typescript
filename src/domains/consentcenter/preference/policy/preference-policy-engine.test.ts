import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferencePolicyEngine } from "./preference-policy-engine.js";
import { newPreferencePolicy } from "./preference-policy.js";

test("PreferencePolicyEngine keeps results within bounds", () => {
  const engine = defaultPreferencePolicyEngine(flags.newRegistry());
  const item = newPreferencePolicy("code-218", "name-722");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
