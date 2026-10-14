import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPreferencePolicyEngine } from "./default-preference-policy-engine.js";
import { newDefaultPreferencePolicy } from "./default-preference-policy.js";

test("DefaultPreferencePolicyEngine keeps results within bounds", () => {
  const engine = defaultDefaultPreferencePolicyEngine(flags.newRegistry());
  const item = newDefaultPreferencePolicy("code-239", "title-235");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
