import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackLevelPreferenceEngine } from "./fallback-level-preference-engine.js";
import { newFallbackLevelPreference } from "./fallback-level-preference.js";

test("FallbackLevelPreferenceEngine keeps results within bounds", () => {
  const engine = defaultFallbackLevelPreferenceEngine(flags.newRegistry());
  const item = newFallbackLevelPreference("code-633", "label-74");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
