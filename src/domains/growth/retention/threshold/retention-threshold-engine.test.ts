import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionThresholdEngine } from "./retention-threshold-engine.js";
import { newRetentionThreshold } from "./retention-threshold.js";

test("RetentionThresholdEngine keeps results within bounds", () => {
  const engine = defaultRetentionThresholdEngine();
  const item = newRetentionThreshold("code-664", "name-683");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
