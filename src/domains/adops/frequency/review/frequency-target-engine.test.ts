import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyTargetEngine } from "./frequency-target-engine.js";
import { newFrequencyTarget } from "./frequency-target.js";

test("FrequencyTargetEngine keeps results within bounds", () => {
  const engine = defaultFrequencyTargetEngine();
  const item = newFrequencyTarget("code-970", "name-329");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
