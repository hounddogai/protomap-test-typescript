import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedInsightOverrideEngine } from "./weighted-insight-override-engine.js";
import { newWeightedInsightOverride } from "./weighted-insight-override.js";

test("WeightedInsightOverrideEngine keeps results within bounds", () => {
  const engine = defaultWeightedInsightOverrideEngine();
  const item = newWeightedInsightOverride("code-95", "label-864");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
