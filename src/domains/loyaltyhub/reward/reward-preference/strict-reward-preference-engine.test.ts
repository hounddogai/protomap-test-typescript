import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictRewardPreferenceEngine } from "./strict-reward-preference-engine.js";
import { newStrictRewardPreference } from "./strict-reward-preference.js";

test("StrictRewardPreferenceEngine keeps results within bounds", () => {
  const engine = defaultStrictRewardPreferenceEngine(flags.newRegistry());
  const item = newStrictRewardPreference("code-663", "title-232");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
