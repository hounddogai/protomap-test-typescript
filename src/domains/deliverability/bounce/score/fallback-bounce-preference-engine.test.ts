import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackBouncePreferenceEngine } from "./fallback-bounce-preference-engine.js";
import { newFallbackBouncePreference } from "./fallback-bounce-preference.js";

test("FallbackBouncePreferenceEngine keeps results within bounds", () => {
  const engine = defaultFallbackBouncePreferenceEngine(flags.newRegistry());
  const item = newFallbackBouncePreference("code-762", "label-40");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
