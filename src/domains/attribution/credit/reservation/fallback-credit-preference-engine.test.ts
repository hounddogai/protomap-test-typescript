import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackCreditPreferenceEngine } from "./fallback-credit-preference-engine.js";
import { newFallbackCreditPreference } from "./fallback-credit-preference.js";

test("FallbackCreditPreferenceEngine keeps results within bounds", () => {
  const engine = defaultFallbackCreditPreferenceEngine(flags.newRegistry());
  const item = newFallbackCreditPreference("code-991", "name-574");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
