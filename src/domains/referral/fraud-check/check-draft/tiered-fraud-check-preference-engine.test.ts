import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredFraudCheckPreferenceEngine } from "./tiered-fraud-check-preference-engine.js";
import { newTieredFraudCheckPreference } from "./tiered-fraud-check-preference.js";

test("TieredFraudCheckPreferenceEngine keeps results within bounds", () => {
  const engine = defaultTieredFraudCheckPreferenceEngine(flags.newRegistry());
  const item = newTieredFraudCheckPreference("code-496", "name-155");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
