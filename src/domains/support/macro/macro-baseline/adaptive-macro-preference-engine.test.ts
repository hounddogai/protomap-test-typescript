import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveMacroPreferenceEngine } from "./adaptive-macro-preference-engine.js";
import { newAdaptiveMacroPreference } from "./adaptive-macro-preference.js";

test("AdaptiveMacroPreferenceEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveMacroPreferenceEngine(flags.newRegistry());
  const item = newAdaptiveMacroPreference("code-180", "name-863");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
