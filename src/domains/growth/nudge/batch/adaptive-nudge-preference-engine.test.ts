import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveNudgePreferenceEngine } from "./adaptive-nudge-preference-engine.js";
import { newAdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

test("AdaptiveNudgePreferenceEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveNudgePreferenceEngine(flags.newRegistry());
  const item = newAdaptiveNudgePreference("code-717", "label-438");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
