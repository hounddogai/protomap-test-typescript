import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyBaselineEngine } from "./frequency-baseline-engine.js";
import { newFrequencyBaseline } from "./frequency-baseline.js";

test("FrequencyBaselineEngine keeps results within bounds", () => {
  const engine = defaultFrequencyBaselineEngine();
  const item = newFrequencyBaseline("code-372", "name-648");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
