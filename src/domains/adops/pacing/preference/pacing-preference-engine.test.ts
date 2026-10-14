import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingPreferenceEngine } from "./pacing-preference-engine.js";
import { newPacingPreference } from "./pacing-preference.js";

test("PacingPreferenceEngine keeps results within bounds", () => {
  const engine = defaultPacingPreferenceEngine(flags.newRegistry());
  const item = newPacingPreference("code-304", "name-335");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
