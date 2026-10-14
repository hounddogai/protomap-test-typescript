import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingRewardPreferenceEngine } from "./rolling-reward-preference-engine.js";
import { newRollingRewardPreference } from "./rolling-reward-preference.js";

test("RollingRewardPreferenceEngine keeps results within bounds", () => {
  const engine = defaultRollingRewardPreferenceEngine(flags.newRegistry());
  const item = newRollingRewardPreference("code-389", "label-541");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
