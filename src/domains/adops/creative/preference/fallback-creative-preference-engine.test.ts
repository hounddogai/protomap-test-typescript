import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackCreativePreferenceEngine } from "./fallback-creative-preference-engine.js";
import { newFallbackCreativePreference } from "./fallback-creative-preference.js";

test("FallbackCreativePreferenceEngine keeps results within bounds", () => {
  const engine = defaultFallbackCreativePreferenceEngine(flags.newRegistry());
  const item = newFallbackCreativePreference("code-815", "title-381");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
