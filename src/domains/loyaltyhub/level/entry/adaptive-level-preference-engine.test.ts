import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveLevelPreferenceEngine } from "./adaptive-level-preference-engine.js";
import { newAdaptiveLevelPreference } from "./adaptive-level-preference.js";

test("AdaptiveLevelPreferenceEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveLevelPreferenceEngine(flags.newRegistry());
  const item = newAdaptiveLevelPreference("code-296", "name-443");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
