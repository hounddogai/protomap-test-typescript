import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceBaselineEngine } from "./preference-baseline-engine.js";
import { newPreferenceBaseline } from "./preference-baseline.js";

test("PreferenceBaselineEngine keeps results within bounds", () => {
  const engine = defaultPreferenceBaselineEngine(flags.newRegistry());
  const item = newPreferenceBaseline("code-863", "name-64");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
