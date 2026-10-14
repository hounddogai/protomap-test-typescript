import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardPreferenceEngine } from "./reward-preference-engine.js";
import { newRewardPreference } from "./reward-preference.js";

test("RewardPreferenceEngine keeps results within bounds", () => {
  const engine = defaultRewardPreferenceEngine(flags.newRegistry());
  const item = newRewardPreference("code-297", "name-67");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
