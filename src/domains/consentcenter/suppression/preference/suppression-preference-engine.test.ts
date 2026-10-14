import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionPreferenceEngine } from "./suppression-preference-engine.js";
import { newSuppressionPreference } from "./suppression-preference.js";

test("SuppressionPreferenceEngine keeps results within bounds", () => {
  const engine = defaultSuppressionPreferenceEngine(flags.newRegistry());
  const item = newSuppressionPreference("code-682", "title-138");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
