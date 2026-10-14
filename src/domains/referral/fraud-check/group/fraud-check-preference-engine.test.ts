import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckPreferenceEngine } from "./fraud-check-preference-engine.js";
import { newFraudCheckPreference } from "./fraud-check-preference.js";

test("FraudCheckPreferenceEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckPreferenceEngine(flags.newRegistry());
  const item = newFraudCheckPreference("code-549", "name-433");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
