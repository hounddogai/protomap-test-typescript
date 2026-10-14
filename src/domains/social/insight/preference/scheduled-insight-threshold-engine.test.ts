import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledInsightThresholdEngine } from "./scheduled-insight-threshold-engine.js";
import { newScheduledInsightThreshold } from "./scheduled-insight-threshold.js";

test("ScheduledInsightThresholdEngine keeps results within bounds", () => {
  const engine = defaultScheduledInsightThresholdEngine();
  const item = newScheduledInsightThreshold("code-145", "name-903");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
