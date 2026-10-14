import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyVarianceEngine } from "./frequency-variance-engine.js";
import { newFrequencyVariance } from "./frequency-variance.js";

test("FrequencyVarianceEngine keeps results within bounds", () => {
  const engine = defaultFrequencyVarianceEngine();
  const item = newFrequencyVariance("code-53", "name-945");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
