import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalDoubleOptInThresholdEngine } from "./global-double-opt-in-threshold-engine.js";
import { newGlobalDoubleOptInThreshold } from "./global-double-opt-in-threshold.js";

test("GlobalDoubleOptInThresholdEngine keeps results within bounds", () => {
  const engine = defaultGlobalDoubleOptInThresholdEngine();
  const item = newGlobalDoubleOptInThreshold("code-25", "name-461");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
