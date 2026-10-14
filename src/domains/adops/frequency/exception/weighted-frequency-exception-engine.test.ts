import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedFrequencyExceptionEngine } from "./weighted-frequency-exception-engine.js";
import { newWeightedFrequencyException } from "./weighted-frequency-exception.js";

test("WeightedFrequencyExceptionEngine keeps results within bounds", () => {
  const engine = defaultWeightedFrequencyExceptionEngine();
  const item = newWeightedFrequencyException("code-919", "label-712");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
