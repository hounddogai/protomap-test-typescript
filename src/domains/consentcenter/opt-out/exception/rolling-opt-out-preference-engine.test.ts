import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingOptOutPreferenceEngine } from "./rolling-opt-out-preference-engine.js";
import { newRollingOptOutPreference } from "./rolling-opt-out-preference.js";

test("RollingOptOutPreferenceEngine keeps results within bounds", () => {
  const engine = defaultRollingOptOutPreferenceEngine(flags.newRegistry());
  const item = newRollingOptOutPreference("code-862", "title-728");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
