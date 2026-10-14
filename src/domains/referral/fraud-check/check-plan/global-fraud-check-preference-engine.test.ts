import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalFraudCheckPreferenceEngine } from "./global-fraud-check-preference-engine.js";
import { newGlobalFraudCheckPreference } from "./global-fraud-check-preference.js";

test("GlobalFraudCheckPreferenceEngine keeps results within bounds", () => {
  const engine = defaultGlobalFraudCheckPreferenceEngine(flags.newRegistry());
  const item = newGlobalFraudCheckPreference("code-211", "name-556");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
