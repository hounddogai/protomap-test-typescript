import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveFrequencyGroupEngine } from "./adaptive-frequency-group-engine.js";
import { newAdaptiveFrequencyGroup } from "./adaptive-frequency-group.js";

test("AdaptiveFrequencyGroupEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveFrequencyGroupEngine();
  const item = newAdaptiveFrequencyGroup("code-534", "label-16");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
