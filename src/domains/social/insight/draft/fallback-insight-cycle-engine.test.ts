import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackInsightCycleEngine } from "./fallback-insight-cycle-engine.js";
import { newFallbackInsightCycle } from "./fallback-insight-cycle.js";

test("FallbackInsightCycleEngine keeps results within bounds", () => {
  const engine = defaultFallbackInsightCycleEngine();
  const item = newFallbackInsightCycle("code-813", "label-584");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
