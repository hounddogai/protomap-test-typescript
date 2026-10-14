import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualPreferenceBaselineEngine } from "./manual-preference-baseline-engine.js";
import { newManualPreferenceBaseline } from "./manual-preference-baseline.js";

test("ManualPreferenceBaselineEngine keeps results within bounds", () => {
  const engine = defaultManualPreferenceBaselineEngine();
  const item = newManualPreferenceBaseline("code-445", "title-138");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
