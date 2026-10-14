import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationPreferenceEngine } from "./reputation-preference-engine.js";
import { newReputationPreference } from "./reputation-preference.js";

test("ReputationPreferenceEngine keeps results within bounds", () => {
  const engine = defaultReputationPreferenceEngine(flags.newRegistry());
  const item = newReputationPreference("code-19", "name-13");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
