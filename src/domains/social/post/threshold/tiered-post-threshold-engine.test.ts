import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPostThresholdEngine } from "./tiered-post-threshold-engine.js";
import { newTieredPostThreshold } from "./tiered-post-threshold.js";

test("TieredPostThresholdEngine keeps results within bounds", () => {
  const engine = defaultTieredPostThresholdEngine();
  const item = newTieredPostThreshold("code-594", "title-621");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
